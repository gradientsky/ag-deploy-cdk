import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

interface ModelProps {
    modelS3Key: string;
    modelLocalPath: string;
    endpointName: string;

    variantName: string;
    variantWeight: number;
    instanceCount: number;
    instanceType: string;
    modelName: string;

    dataLoggingEnable: boolean;
    dataLoggingS3Key: string;
    dataLoggingPercentage: number;

    modelDockerImage: string;
}

export class AgDeployCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, modelProps: ModelProps, props?: cdk.StackProps) {
        super(scope, id, props);

        // ---------------------------------------------------------------------------- Model archive publishing

        const baseName = id
        const modelBucketSuffix: string = `${props?.env?.region}-${props?.env?.account}`
        const modelBucket = new s3.Bucket(this, `${modelProps.endpointName}-ModelBucket`, {
            bucketName: `${baseName}-${modelBucketSuffix}`.toLowerCase().replace('_', '-'),
            versioned: false,
            // removalPolicy: cdk.RemovalPolicy.RETAIN // for prod, RETAIN is safe
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const deployment = new s3deploy.BucketDeployment(this, `${modelProps.modelS3Key}-UploadModel`, {
            destinationBucket: modelBucket,
            destinationKeyPrefix: modelProps.modelS3Key,
            sources: [s3deploy.Source.asset(modelProps.modelLocalPath)],
            memoryLimit: 1024
        });

        // ---------------------------------------------------------------------------- Model deployment

        const roleName = `${modelProps.endpointName}-Role`;
        const role = new iam.Role(this, roleName, {
            roleName: roleName,
            assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
            ],
        });

        const modelName = `${modelProps.endpointName}-Model`;
        const model = new sagemaker.CfnModel(this, modelName, {
            modelName: modelName,
            executionRoleArn: role.roleArn,
            containers: [
                {
                    image: modelProps.modelDockerImage,
                    modelDataUrl: `s3://${modelBucket.bucketName}/${modelProps.modelS3Key}/model.tar.gz`,
                    environment: {
                        SAGEMAKER_SUBMIT_DIRECTORY: '/opt/ml/model/code',
                        SAGEMAKER_PROGRAM: 'inference.py'
                    }
                }
            ]
        });
        model.node.addDependency(deployment)

        const modelLoggingBucket = new s3.Bucket(this, `${modelProps.endpointName}-ModelLoggingBucket`, {
            bucketName: `${baseName}-${modelBucketSuffix}-logging`.toLowerCase().replace('_', '-'),
            versioned: false,
            // removalPolicy: cdk.RemovalPolicy.RETAIN // for prod, RETAIN is safe
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const endpointConfigName = `${modelProps.endpointName}-Config`;
        const endpointConfig = new sagemaker.CfnEndpointConfig(this, `${modelProps.endpointName}-Config`, {
            endpointConfigName: endpointConfigName,
            productionVariants: [{
                modelName: model.attrModelName,
                variantName: modelProps.variantName,
                initialVariantWeight: modelProps.variantWeight,
                initialInstanceCount: modelProps.instanceCount,
                instanceType: modelProps.instanceType
            }],
            dataCaptureConfig: {
                captureOptions: [{captureMode: 'Input'}, {captureMode: 'Output'}],
                enableCapture: modelProps.dataLoggingEnable,
                destinationS3Uri: `s3://${modelLoggingBucket.bucketName}/${modelProps.dataLoggingS3Key}`,
                initialSamplingPercentage: modelProps.dataLoggingPercentage
            }
        });

        const endpointName = `${modelProps.endpointName}-Endpoint`;
        const endpoint = new sagemaker.CfnEndpoint(this, endpointName, {
            endpointName: endpointName,
            endpointConfigName: endpointConfig.attrEndpointConfigName
        });

        // ---------------------------------------------------------------------------- Stack outputs

        new cdk.CfnOutput(this, 'ModelBucket', {value: modelBucket.bucketName});
        new cdk.CfnOutput(this, 'Model', {value: model.attrModelName});
        new cdk.CfnOutput(this, 'ModelLoggingBucket', {value: modelLoggingBucket.bucketName});
        new cdk.CfnOutput(this, 'EndpointConfig', {value: endpointConfig.attrEndpointConfigName});
        new cdk.CfnOutput(this, 'Endpoint', {value: endpoint.attrEndpointName});
    }
}
