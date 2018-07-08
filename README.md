# Project Title

One Paragraph of project description goes here

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```
Give examples
```

### Installing

A step by step series of examples that tell you how to get a development env running

Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc


## DB
CREATE TABLE address (
    guid   BLOB (32) PRIMARY KEY
                     UNIQUE
                     NOT NULL
                     DEFAULT (lower(hex(randomblob(16) ) ) ),
    city   BLOB (32) REFERENCES city (guid)
                     NOT NULL,
    street TEXT,
    house  TEXT
);
CREATE TABLE city (
    guid BLOB (32) PRIMARY KEY
                   UNIQUE
                   NOT NULL
                   DEFAULT (lower(hex(randomblob(16) ) ) ),
    name TEXT      NOT NULL
                   UNIQUE
);
CREATE TABLE geo (
    guid      BLOB (32) PRIMARY KEY
                        UNIQUE
                        NOT NULL
                        DEFAULT (lower(hex(randomblob(16) ) ) ),
    address   BLOB (32) REFERENCES address (guid),
    latitude  TEXT,
    longitude TEXT
);
CREATE TABLE information (
    guid     BLOB (32) PRIMARY KEY
                       UNIQUE
                       NOT NULL
                       DEFAULT (lower(hex(randomblob(16) ) ) ),
    relation BLOB (32) REFERENCES relation (guid)
                       NOT NULL,
    text     TEXT
);
CREATE TABLE relation (
    guid       BLOB (32) PRIMARY KEY
                         UNIQUE
                         NOT NULL
                         DEFAULT (lower(hex(randomblob(16) ) ) ),
    address_p  BLOB (32) REFERENCES address (guid)
                         NOT NULL,
    address_c  BLOB (32) REFERENCES address (guid)
                         NOT NULL,
    override   BOOLEAN   DEFAULT (0)
                         NOT NULL,
    deprecated BOOLEAN   NOT NULL
                         DEFAULT (0),
    CONSTRAINT uniqaddr UNIQUE (
        address_p,
        address_c
    )
    ON CONFLICT REPLACE
);

PRAGMA foreign_keys = 0;

CREATE TABLE sqlitestudio_temp_table AS SELECT * FROM relation;

DROP TABLE relation;

CREATE TABLE relation (
    guid       BLOB (32) PRIMARY KEY
                         UNIQUE
                         NOT NULL
                         DEFAULT (lower(hex(randomblob(16) ) ) ),
    address_p  BLOB (32) REFERENCES address (guid)
                         NOT NULL,
    address_c  BLOB (32) REFERENCES address (guid)
                         NOT NULL,
    override   BOOLEAN   DEFAULT (0)
                         NOT NULL,
    deprecated BOOLEAN   NOT NULL
                         DEFAULT (0),
    CONSTRAINT uniqaddr UNIQUE (address_p, address_c) ON CONFLICT REPLACE
);

INSERT INTO relation (
                         guid,
                         address_p,
                         address_c,
                         override,
                         deprecated
                     )
                     SELECT guid,
                            address_p,
                            address_c,
                            override,
                            deprecated
                       FROM sqlitestudio_temp_table;

DROP TABLE sqlitestudio_temp_table;

PRAGMA foreign_keys = 1;

CREATE TABLE users (
    guid     BLOB (32)   PRIMARY KEY
                         UNIQUE
                         NOT NULL
                         DEFAULT (lower(hex(randomblob(16) ) ) ),
    login    TEXT        UNIQUE
                         NOT NULL,
    password TEXT        NOT NULL,
    info     TEXT,
    active   BOOLEAN (1) NOT NULL
                         DEFAULT (1)
);

CREATE TABLE history (
    guid     BLOB (32) DEFAULT (lower(hex(randomblob(16) ) ) )
                       NOT NULL
                       PRIMARY KEY
                       UNIQUE,
    uname    BLOB (32) REFERENCES users (guid),
    ip       TEXT      DEFAULT ('0.0.0.0')
                       NOT NULL,
    date     DATETIME  DEFAULT (CURRENT_TIMESTAMP)
                       NOT NULL,
    [action] TEXT,
    info     TEXT
);


