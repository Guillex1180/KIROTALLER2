import os
import shutil
import subprocess
import jsii
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    BundlingOptions,
    ILocalBundling,
    aws_lambda as lambda_,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as integrations,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_iam as iam,
)
from constructs import Construct


@jsii.implements(ILocalBundling)
class LocalNpmBundler:
    """
    Copies the server source into the CDK asset output directory and runs
    'npm install --omit=dev' locally — no Docker required.
    """

    def __init__(self, source_dir: str):
        self._source_dir = os.path.realpath(source_dir)

    def try_bundle(self, output_dir: str, options) -> bool:
        try:
            shutil.copytree(self._source_dir, output_dir, dirs_exist_ok=True)
            result = subprocess.run(
                ["npm", "install", "--omit=dev"],
                cwd=output_dir,
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                print(f"[bundler] npm install failed:\n{result.stderr}")
                return False
            print("✅ Local bundling succeeded (no Docker required)")
            return True
        except Exception as exc:
            print(f"[bundler] local bundling error: {exc}")
            return False


class KirotallerStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ── S3 bucket for frontend ────────────────────────────────────────────
        frontend_bucket = s3.Bucket(
            self, "FrontendBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        # ── CloudFront OAC + Distribution ─────────────────────────────────────
        oac = cloudfront.S3OriginAccessControl(
            self, "FrontendOAC",
            signing=cloudfront.Signing.SIGV4_NO_OVERRIDE,
        )

        distribution = cloudfront.Distribution(
            self, "FrontendDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(
                    frontend_bucket,
                    origin_access_control=oac,
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD,
            ),
            # SPA fallback — all 403/404 → index.html
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(0),
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html",
                    ttl=Duration.seconds(0),
                ),
            ],
            default_root_object="index.html",
        )

        # Grant CloudFront read access to the S3 bucket
        frontend_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                actions=["s3:GetObject"],
                resources=[frontend_bucket.arn_for_objects("*")],
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{distribution.distribution_id}"
                    }
                },
            )
        )

        cloudfront_url = f"https://{distribution.distribution_domain_name}"

        # ── Lambda function (Express backend) ────────────────────────────────
        server_dir = os.path.join(
            os.path.dirname(__file__), "..", "ecommerce", "server"
        )

        backend_fn = lambda_.Function(
            self, "BackendFunction",
            runtime=lambda_.Runtime.NODEJS_22_X,
            handler="src/lambda.handler",
            code=lambda_.Code.from_asset(
                server_dir,
                bundling=BundlingOptions(
                    # Docker fallback (used only if local bundling fails)
                    image=lambda_.Runtime.NODEJS_22_X.bundling_image,
                    command=[
                        "bash", "-c",
                        "cp -r /asset-input/. /asset-output && cd /asset-output && npm install --omit=dev",
                    ],
                    local=LocalNpmBundler(server_dir),
                ),
            ),
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "NODE_ENV": "production",
                "FRONTEND_URL": cloudfront_url,
            },
        )

        # ── API Gateway HTTP API ──────────────────────────────────────────────
        http_api = apigwv2.HttpApi(
            self, "BackendApi",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_origins=[cloudfront_url, "http://localhost:5173"],
                allow_methods=[
                    apigwv2.CorsHttpMethod.GET,
                    apigwv2.CorsHttpMethod.POST,
                    apigwv2.CorsHttpMethod.PUT,
                    apigwv2.CorsHttpMethod.DELETE,
                    apigwv2.CorsHttpMethod.OPTIONS,
                ],
                allow_headers=["Content-Type", "X-Session-ID"],
            ),
        )

        lambda_integration = integrations.HttpLambdaIntegration(
            "BackendIntegration", backend_fn
        )

        http_api.add_routes(
            path="/{proxy+}",
            methods=[apigwv2.HttpMethod.ANY],
            integration=lambda_integration,
        )

        api_url = http_api.url.rstrip("/")

        # ── Outputs ────────────────────────────────────────────────────────────
        CfnOutput(self, "BackendURL",
                  value=api_url,
                  description="Backend API Gateway URL (use as VITE_API_URL for frontend build)")

        CfnOutput(self, "FrontendURL",
                  value=cloudfront_url,
                  description="Frontend CloudFront URL")

        CfnOutput(self, "FrontendBucketName",
                  value=frontend_bucket.bucket_name,
                  description="S3 bucket for frontend assets")

        CfnOutput(self, "CloudFrontDistributionId",
                  value=distribution.distribution_id,
                  description="CloudFront Distribution ID")
