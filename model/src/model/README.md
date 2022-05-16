# model upload

Don't delete this ***model*** directory.

This directory should contain expanded AutoGluon model files, which are later going to be packaged into deployable ***model.tar.gz*** file.

The expected content of this directory looks like
```plain
src
└── model
    ├── __version__
    ├── models
    ├── learner.pkl
    ├── predictor.pkl
    └── README.md      # this file
```

***model.tar.gz*** file can be created by ***pack_models.sh*** script in ***script*** directory.
