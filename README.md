# Deploying AutoGluon models using CDK

## CDK
This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Project layout
```plain
ag-deploy-cdk/
├── README.md
├── bin
│   └── ag-deploy-cdk.ts
├── cdk.json
├── jest.config.js
├── lib
│   └── ag-deploy-cdk-stack.ts
├── model
│   ├── deploy
│   │   ├── README.md
│   │   └── model.tar.gz                  # Deployable archive assembled from components in src/
│   └── src
│       ├── code
│       │   ├── inference.py
│       │   └── requirements.txt          # Inference script
│       └── model                         # AutoGluon model files are going here
│           ├── README.md
│           ├── __version__
│           ├── learner.pkl
│           ├── models
│           │   ├── KNeighborsUnif
│           │   │   └── model.pkl
│           │   ├── LightGBM
│           │   │   └── model.pkl
│           │   └── ...
│           └── predictor.pkl
├── package-lock.json
├── package.json
├── script
│   └── pack_models.sh                   # Script to pack components from model/src into model/deploy.tar.gz
├── test
│   └── ag-deploy-cdk.test.ts
└── tsconfig.json
```

## Inference using boto3
```python
import boto3
import json
 
endpoint = 'AutoGluonEndpoint-Endpoint'
 
runtime = boto3.Session().client('sagemaker-runtime')

payload = test_data.drop(columns=label).to_csv(index=False, header=False)
response = runtime.invoke_endpoint(EndpointName=endpoint, ContentType='text/csv', Body=payload)

# Unpack response
result = json.loads(response['Body'].read().decode())
```
