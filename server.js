const axios = require('axios');

// GraphDB endpoint and repo ID
const graphdbBaseUrl = 'http://localhost:7200';
const repositoryId = 'AIModels';

// API endpoint for SPARQL update
const sparqlUpdateEndpoint = `${graphdbBaseUrl}/repositories/${repositoryId}/statements`;


// SPARQL INSERT template
const insertCatalogueTemplate = `
PREFIX dcat: <https://www.w3.org/ns/dcat#>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

INSERT DATA{
    dcat:{catalogue} a dcat:catalog ;
    dct:description "{description}" ;
    dct:publisher "{publisher}" ;
}
;
`;

// Template to insert resources
const insertResourceTemplate = `
PREFIX dcat: <https://www.w3.org/ns/dcat#>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX airo: <https://w3id.org/airo#>

INSERT DATA {
    dcat:{resourceID} a dcat:resource ;
        dct:title "{resourceTitle}" ;
        dct:creator "{creator}" ;
        dct:issued "{issueDate}"^^xsd:date ;
        dct:description "{description}" ;
        airo:isAppliedWithinDomain "{dom}" ;
        airo:hasPurpose "{purp}" ;
        airo:hasCapability "{cap}" ;
        airo:isUsedBy "{user}" ;
        airo:hasAISubject "{sub}" .
};
`;

const insertDistributionTemplate = `
PREFIX dcat: <https://www.w3.org/ns/dcat#>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dct: <http://purl.org/dc/terms/>

INSERT DATA{
    dcat:{distribution} a dcat:Distribution ;
    dcat:accessURL <{accessLink}> ;
    dct:issued "{date}" .
}
;
`;

const insertRelationshipTemplate = `
PREFIX dcat: <https://www.w3.org/ns/dcat#>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

INSERT DATA{
    dcat:{resourceTitle} dcat:dataset dcat:{distID} .
}
;
`;

const insertPolicyTemplate = `
PREFIX dcat: <https://www.w3.org/ns/dcat#>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

INSERT DATA{
    odrl:{policy} a odrl:Policy ;
    dcat:accessURL <{accessLink}> .
}
;
`;

const assignPolicyTemplate = `
PREFIX dcat: <https://www.w3.org/ns/dcat#>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

INSERT DATA{
    dcat:{distribution} odrl:hasPolicy odrl:{policy} .
}
;
`;

const insertUsageTemplate = `
PREFIX dcat: <https://www.w3.org/ns/dcat#>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX foaf: <http://xmlns.com/foaf/spec/#>
PREFIX duv: <http://www.w3.org/ns/duv#>
PREFIX dct: <http://purl.org/dc/terms/>

INSERT DATA{
    duv:{usage} a duv:Usage ;
    foaf:organisation {Organisation} ;
    dct:issued {date} ;
    dcat:accessURL <{accessLink}> .
}
;
`;
const assignUsageTemplate = `
PREFIX dcat: <https://www.w3.org/ns/dcat#>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX duv: <http://www.w3.org/ns/duv#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

INSERT DATA{
    dcat:{distribution} duv:hasUsage duv:{Usage} .
}
;
`;
const UsageHasResourceTemplate = `
PREFIX dcat: <https://www.w3.org/ns/dcat#>
PREFIX odrl: <http://www.w3.org/ns/odrl/2/>
PREFIX duv: <http://www.w3.org/ns/duv#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

INSERT DATA{
    duv:{usage} dcat:dataset dcat:{Resource} .
}
;
`;

async function searchDistributionByPolicy(policyURI) {
    const searchByLicence = `
        PREFIX airo: <https://w3id.org/airo#>
        PREFIX dcat: <https://www.w3.org/ns/dcat#>
        PREFIX odrl: <http://www.w3.org/ns/odrl/2/>

        SELECT ?Distribution
        WHERE {
            ?Distribution a dcat:Distribution ;
                          odrl:hasPolicy <${policyURI}> .
        }
    `;

    try {
        console.log('---------------------------------------');

        const response = await axios.post(
            sparqlUpdateEndpoint,
            searchByLicence,
            {
                headers: {
                    'Content-Type': 'application/sparql-query',
                    // Add any additional headers if required
                },
            }
        );
        console.log('---------------------------------------');
        console.log(response);
        console.log('---------------------------------------');
        if (response.status === 200) {
            // Extract the results from the response
            const results = response.data.results.bindings;
            const distributions = results.map(result => result.Distribution.value);
            return distributions;
        } else {
            console.error('Failed to execute SPARQL query:', response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error executing SPARQL query:', error.message);
        return null;
    }
}

// Example usage
const policyURI = 'http://www.w3.org/ns/odrl/2/TextToSpeechLicence';
searchDistributionByPolicy(policyURI)
    .then(distributions => {
        if (distributions) {
            console.log('Distributions:', distributions);
        } else {
            console.log('No distributions found.');
        }
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });

// Data to be inserted
const catalog = [
    { catID: 'CompA', description: 'A catalog of open source AI models', publisher: 'OpenSourceAILtd'},
];

// Data to be inserted
const resources = [
    { resID: 'facialrecognitionID', creator: 'Meta', title: 'facial-recog', date: '2024-03-10', desc: 'This model is used for facial recognition', domain:'Law Enforcement', purpose: 'Facial Recognition', capability: 'Match face with database of faces', user: 'Law Enforcement Authority', subject: 'Crime Suspects'  },
    { resID: 'texttospeechID', creator: 'Google', title: 'text-to-speech', date: '2024-03-09', desc: 'This model is for text to speech software', domain:'Communication', purpose: 'Converting text to spoken language', capability: 'Generate human-like speech from text', user: 'Mute Persons', subject: 'Language Learner' },
    { resID: 'image-classificationID', creator: 'Microsoft', title: 'image-classification', date: '2024-03-08', desc: 'Model for classifying biomedical scans of tumors - benign,malignant,normal', domain:'Healthcare', purpose: 'Determine danger of tumor', capability: 'Tumor classification', user: 'Radiologist', subject: 'Hospital Patients' },
    { resID: 'textgenID', creator: 'anon123', title: 'OpenAI', date: '2024-03-01', desc: 'Question Answering Model', domain:'Retail', purpose: 'Customer Service Assistance', capability: 'Question Answering given context', user: 'Retail Companies', subject: 'Retail Customers'},
];

const distribution = [
    { distribution: 'FacialRecognitionDist1.1', accessURL: 'https://huggingface.co/', date: '2024-03-20'},
    { distribution: 'TextToSpeechDist1.2', accessURL: 'https://huggingface.co/', date: '2024-03-17'},
    { distribution: 'BiomedicalImageClassifierDist1.3', accessURL: 'https://huggingface.co/', date: '2024-03-19'},
    { distribution: 'TextGenDist1.4', accessURL: 'https://huggingface.co/', date: '2024-03-18'},
];

// The link to policies can be github repo
const policies = [
    { policy: 'FacialRecogLicence', accessURL:'https://raw.githubusercontent.com/bod777/DataConsensus/main/OCPExamples.ttl'},
    { policy: 'TextToSpeechLicence', accessURL:'https://raw.githubusercontent.com/bod777/DataConsensus/main/OCPExamples.ttl'},
    { policy: 'ImagingLicence', accessURL:'https://raw.githubusercontent.com/bod777/DataConsensus/main/OCPExamples.ttl'},
    { policy: 'TextGenLicence', accessURL:'https://raw.githubusercontent.com/bod777/DataConsensus/main/OCPExamples.ttl'},
];

const usage = [
    { usage: 'UsageID0001', organisation: 'MacroHard', date: '2024-04-03', accessURL: 'https://example.com'},
];

const resource1 = [
    { resID: 'SportsBettingCustServiceID', creator: 'MacroHard', title: 'SportsBettingCustService001', date: '2024-04-03', desc: 'This model is fine tuned for answering sports betting related questions', domain:'Retail', purpose: 'Customer Assistance', capability: 'To answer betting related questions', user: 'Bookmakers', subject: 'Gambling Customers' },
]

const policy1 = [
    { policy: 'GPAILicence', accessURL:'https://raw.githubusercontent.com/bod777/DataConsensus/main/OCPExamples.ttl' },
]

async function insertCatalogue(catalog, description, publisher) {
    const sparqlQuery = insertCatalogueTemplate.replace(/{catalogue}/g, catalog).replace(/{description}/g, description).replace(/{publisher}/g, publisher);

    try {
        const response = await axios.post(sparqlUpdateEndpoint, `update=${encodeURIComponent(sparqlQuery)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200 || response.data === '') {
            console.log(`Data inserted successfully for Catalogue ${catalog}`);
        } else {
            console.error(`Failed to insert data for Catalogue ${catalog}. Error: ${response.data}`);
        }
    } catch (error) {
        if(error != ' '){
            console.error(`Error inserting data for Catalogue ${catalog}: ${error.message}`);
        }
    }
}

// Working function to insert resources - uses insertResourceTemplate
async function insertResource(resID, creator, title, date, desc, dom, purp, cap, user, sub) {
    const sparqlQuery = insertResourceTemplate.replace(/{resourceID}/g, resID).replace(/{creator}/g, creator)
    .replace(/{resourceTitle}/g, title).replace(/{issueDate}/g, date).replace(/{description}/g, desc).replace(/{dom}/g, dom)
    .replace(/{purp}/g, purp).replace(/{cap}/g, cap).replace(/{user}/g, user).replace(/{sub}/g, sub);

    try {
        const response = await axios.post(sparqlUpdateEndpoint, `update=${encodeURIComponent(sparqlQuery)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200 || response.data === '') {
            console.log(`Data inserted successfully for Model ${resID}`);
        } else {
            console.error(`Failed to insert data for Model ${resID}. Error: ${response.data}`);
        }
    } catch (error) {
        if(error != ' '){
            console.error(`Error inserting data for Model ${resID}: ${error.message}`);
        }
    }
}

async function insertDistribution(distribution, accessURL, date) {
    const sparqlQuery = insertDistributionTemplate.replace(/{distribution}/g, distribution).replace(/{accessLink}/g, accessURL).replace(/{date}/g, date);

    try {
        const response = await axios.post(sparqlUpdateEndpoint, `update=${encodeURIComponent(sparqlQuery)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200 || response.data === '') {
            console.log(`Data inserted successfully for Distribution ${distribution}`);
        } else {
            console.error(`Failed to insert data for Distribution ${distribution}. Error: ${response.data}`);
        }
    } catch (error) {
        if(error != ' '){
            console.error(`Error inserting data for Distribution ${distribution}: ${error.message}`);
        }
    }
}

async function insertRelationship(from, to) {
    const sparqlQuery = insertRelationshipTemplate.replace(/{resourceTitle}/g, from).replace(/{distID}/g, to);

    try {
        const response = await axios.post(sparqlUpdateEndpoint, `update=${encodeURIComponent(sparqlQuery)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200 || response.data === '') {
            console.log(`Relationship inserted successfully between ${from} and ${to}`);
        } else {
            console.error(`Failed to insert relationship between ${from} and ${to}. Error: ${response.data}`);
        }
    } catch (error) {
        if(error != ' '){
            console.error(`Error inserting relationship between ${from} and ${to}: ${error.message}`);
        }
    }
}

async function insertPolicy(policyID, accessURL) {
    const sparqlQuery = insertPolicyTemplate.replace(/{policy}/g, policyID).replace(/{accessLink}/g, accessURL);

    try {
        const response = await axios.post(sparqlUpdateEndpoint, `update=${encodeURIComponent(sparqlQuery)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200 || response.data === '') {
            console.log(`Policy ${policyID} inserted successfully`);
        } else {
            console.error(`Failed to insert Policy ${policyID}. Error: ${response.data}`);
        }
    } catch (error) {
        if(error != ' '){
            console.error(`Error inserting Policy ${policyID}: ${error.message}`);
        }
    }
}

async function assignPolicy(distribution, policyID) {
    const sparqlQuery = assignPolicyTemplate.replace(/{distribution}/g, distribution).replace(/{policy}/g, policyID);

    try {
        const response = await axios.post(sparqlUpdateEndpoint, `update=${encodeURIComponent(sparqlQuery)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200 || response.data === '') {
            console.log(`Policy ${policyID} assigned to distribution ${distribution} successfully`);
        } else {
            console.error(`Failed to assign Policy ${policyID} to distribution ${distribution}. Error: ${response.data}`);
        }
    } catch (error) {
        if(error != ' '){
            console.error(`Error assigning Policy ${policyID} to distribution ${distribution}: ${error.message}`);
        }
    }
}

async function insertUsage(usage, organisation, date, accessURL) {
    const sparqlQuery = insertUsageTemplate.replace(/{usage}/g, usage).replace(/{organisation}/g, organisation).replace(/{date}/g, date).replace(/{accessLink}/g, accessURL);

    try {
        const response = await axios.post(sparqlUpdateEndpoint, `update=${encodeURIComponent(sparqlQuery)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200 || response.data === '') {
            console.log(`Usage ${usage} inserted successfully`);
        } else {
            console.error(`Failed to insert Usage ${usage}. Error: ${response.data}`);
        }
    } catch (error) {
        if(error != ' '){
            console.error(`Error inserting Usage ${usage}: ${error.message}`);
        }
    }
}

async function assignUsage(distribution, usage) {
    const sparqlQuery = assignUsageTemplate.replace(/{distribution}/g, distribution).replace(/{Usage}/g, usage);

    try {
        const response = await axios.post(sparqlUpdateEndpoint, `update=${encodeURIComponent(sparqlQuery)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200 || response.data === '') {
            console.log(`Usage relationship ${usage} inserted successfully`);
        } else {
            console.error(`Failed to assign Usage ${usage}. Error: ${response.data}`);
        }
    } catch (error) {
        if(error != ' '){
            console.error(`Error assign Usage ${usage}: ${error.message}`);
        }
    }
}

async function insertUsageHasResource(usage, resource) {
    const sparqlQuery = UsageHasResourceTemplate.replace(/{usage}/g, usage).replace(/{Resource}/g, resource);

    try {
        const response = await axios.post(sparqlUpdateEndpoint, `update=${encodeURIComponent(sparqlQuery)}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.status === 200 || response.data === '') {
            console.log(`Usage relationship ${usage} inserted successfully`);
        } else {
            console.error(`Failed to assign Usage ${usage}. Error: ${response.data}`);
        }
    } catch (error) {
        if(error != ' '){
            console.error(`Error assign Usage ${usage}: ${error.message}`);
        }
    }
}

//Insert Catalogue into DB
catalog.forEach(entry => {
    insertCatalogue(entry.catID);
});

// Insert resources into DB
resources.forEach(entry => {
    insertResource(entry.resID, entry.creator, entry.title, entry.date, entry.desc, entry.domain, entry.purpose, entry.capability, entry.user, entry.subject);
});

// Insert distributions into DB
distribution.forEach(entry => {
    insertDistribution(entry.distribution, entry.accessURL, entry.date);
});

// Insert a relationship between each distribution and catalogue A
distribution.forEach(entry =>{
    dist = entry.distribution;
    catalog.forEach(entry => {
        if(entry.catID === 'CompA'){
            insertRelationship(entry.catID, dist);
        }
        else{
            console.log('CompA not found.');
        }
    });
});

// Insert a relationship between each resource and catalogue A
resources.forEach(entry =>{
    resID = entry.resID;
    catalog.forEach(entry => {
        if(entry.catID === 'CompA'){
            insertRelationship(entry.catID, resID);
        }
        else{
            console.log('Catalogue A not found.');
        }
    });
});

// Insert relationship between each resource and distribution
for(n = 0; n < resources.length; n++){
    resID = resources[n].resID;
    dist = distribution[n].distribution;
    insertRelationship(resID, dist);
};

policies.forEach(entry =>{
    insertPolicy(entry.policy, entry.accessURL);
})

// Insert relationship between each distribution and policy
for(n = 0; n < policies.length; n++){
    policyID = policies[n].policy;
    dist = distribution[n].distribution;
    assignPolicy(dist, policyID);
};

// insert usage
usage.forEach(entry => {
    insertUsage(entry.usage, entry.organisation, entry.date, entry.accessURL);
});

// assign usage to dist
usage.forEach(entry =>{
    uid = entry.usage;
    distribution.forEach(entry => {
        if(entry.distribution === 'TextGenDist1.4'){
            assignUsage(entry.distribution, uid);
        }

        else{
            console.log('Not for text gen model');
        }
    });
});

// Insert resource into DB
resource1.forEach(entry => {
    insertResource(entry.resID, entry.creator, entry.title, entry.date, entry.desc);
});

usage.forEach(entry => {
    uid = entry.usage;
    resource1.forEach(entry => {
        insertUsageHasResource(uid, entry.resID);
    });
});

policy1.forEach(entry => {
    insertPolicy(entry.policy, entry.accessURL);
});

policy1.forEach(entry =>{
    p = entry.policy;
    resource1.forEach(entry => {
        assignPolicy(entry.resID, p);
    });
});
