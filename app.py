#!/usr/bin/env python3
import os

import aws_cdk as cdk

from kirotaller.kirotaller_stack import KirotallerStack


app = cdk.App()
KirotallerStack(app, "KirotallerStack",
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION'),
    ),
)

app.synth()
