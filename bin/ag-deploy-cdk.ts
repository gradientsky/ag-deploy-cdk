#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {AgDeployCdkStack} from '../lib/ag-deploy-cdk-stack';

const app = new cdk.App();
new AgDeployCdkStack(app, 'AgDeployCdkStack',

    {
        modelS3Key: 'model',
        modelLocalPath: 'model/deploy',
        endpointName: 'AutoGluonEndpoint',

        modelName: 'Model-A-20220513',
        variantName: 'Model-A',
        variantWeight: 1,
        instanceCount: 1,
        instanceType: 'ml.c5.2xlarge',

        dataLoggingEnable: true,
        dataLoggingS3Key: 'data-capture',
        dataLoggingPercentage: 30,

        modelDockerImage: '763104351884.dkr.ecr.us-west-2.amazonaws.com/autogluon-inference:0.4.0-cpu-py38-ubuntu20.04',
    },
    {

        /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION,
        },

    });