# AD4M CLI

This is a command-line program for starting and remote-controlling your local AD4M executor.

Start an executor with this command:
```
ad4m serve
```

All sub-clients of the class [Ad4mClient](https://github.com/perspect3vism/ad4m/blob/main/src/Ad4mClient.ts) (from the root [AD4M repo](https://github.com/perspect3vism/ad4m)) map to sub-commands, and their functions to parameters.

So for example, `ad4mClient.expression.get('<url>')` maps to:
```
ad4m expression get <url>
```

## Installation

```
npm install -g @perspect3vism/ad4m-cli
```

This compiles the needed Holochain binaries via nix in the `postinstall` script.
That means
1. you'll need to have nix installed
2. it might take some time

To speed up this process, you can use the Perspect3vism nix cache. Follow these instructions BEFORE running above
install command: https://app.cachix.org/cache/perspect3vism

## Example usage session

First run
```
ad4m serve
```
in a shell window that stays open in the background.


Then open another window and continue there.

### Agent initialization
When running the AD4M executor for the very first time, we need to generate an agent
(i.e. DID and keys) with:
```
ad4m agent generate
```
and enter a passphrase for the new keystore on prompt.

If you have done this before but the executor was restarted, we need to unlock the 
keystore with:
```
ad4m agent unlock
```

Either way, you should end up with an `initialized` and `unlocked` agent status:
```
ad4m agent status

Querying agent status
Attempting to connect to http://localhost:4000/graphql
=>
 AgentStatus {
  isInitialized: true,
  isUnlocked: true,
  did: 'did:key:zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs',
  didDocument: '{"@context":"https://w3id.org/did-resolution/v1","didDocument":{"@context":["https://www.w3.org/ns/did/v1","https://ns.did.ai/transmute/v1",{"@base":"did:key:zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs"}],"id":"did:key:zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs","verificationMethod":[{"id":"#zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs","type":"EcdsaSecp256k1VerificationKey2019","controller":"did:key:zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs","publicKeyBase58":"299WsDtf7fdtfZXh9YH5wDbdn9ZMw8gFVfBL1piZXzY99"}],"authentication":["#zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs"],"assertionMethod":["#zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs"],"capabilityInvocation":["#zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs"],"capabilityDelegation":["#zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs"]},"didDocumentMetadata":{"content-type":"application/did+ld+json"},"didResolutionMetadata":{}}',
  error: undefined
}
```

### Languages
For creating an expression we need to select a language that we create an expression in:
```
ad4m languages all

=>
 [
  {
    name: 'neighbourhood-store',
    address: 'Qmbdx8ybcV4qSAUbLKds5gQVMkLJD7idKMcTBfmt8UEk34'
  },
  {
    name: 'note-ipfs',
    address: 'Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe'
  },
  {
    name: 'languages',
    address: 'QmR2U5cm35CmrnFbS3y6v69qbFryXMzgsAXVWym4w9eErZ'
  },
  {
    name: 'agent-expression-store',
    address: 'QmaV6P8n8cHL5zZTN6Nuv7kJR2cdwjKp1LGtnpvAuRhKJD'
  },
  {
    name: 'social-context',
    address: 'QmZ1mkoY8nLvpxY3Mizx8UkUiwUzjxJxsqSTPPdH8sHxCQ'
  }
]
```
### Creating an Expressions

Let's use the `note-ipfs` language. Above we find it's address: `Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe`

```
ad4m expression create Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe "This is a test note"

=>
 'Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe://Qmeg4GWWFxzJehEZVD12fLcuCARBsuKxVHNFxJGxXiiJs2'
```

What we got back is the URL of this new expression: `Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe://Qmeg4GWWFxzJehEZVD12fLcuCARBsuKxVHNFxJGxXiiJs2`.

### Getting an Expression

Any AD4M node can now get this expression by resolving this URL:

```
ad4m expression get Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe://Qmeg4GWWFxzJehEZVD12fLcuCARBsuKxVHNFxJGxXiiJs2

=>
 {
  author: 'did:key:zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs',
  timestamp: '2021-08-25T19:53:14.821Z',
  data: '"This is a test note"',
  language: { address: 'Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe' },
  proof: { valid: true, invalid: null }
}
```

### Creating a Perspective and linking that new Expression

```
ad4m perspective add "A new perspective on apps..."

=>
 {
  uuid: '2f168edc-363b-4d3b-818c-48b1f98b714b',
  name: 'A new perspective on apps...',
  sharedUrl: null,
  neighbourhood: null
}
```

This new perspective got a random unique ID that is used to reference it in following actions (`2f168edc-363b-4d3b-818c-48b1f98b714b`).

Now we add a link to the expression created above.
The follow command `addLink` takes two parameters where the second one is a string that has to be syntactic correct JSON that 
parses to the [LinkQuery type](https://github.com/perspect3vism/ad4m/blob/main/src/perspectives/LinkQuery.ts)
```
ad4m perspective addLink 2f168edc-363b-4d3b-818c-48b1f98b714b "{\"source\": \"root\", \"target\": \"Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe://Qmeg4GWWFxzJehEZVD12fLcuCARBsuKxVHNFxJGxXiiJs2\"}"

=>
 {
  author: 'did:key:zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs',
  timestamp: '2021-08-25T20:08:23.603Z',
  data: {
    source: 'root',
    predicate: '',
    target: 'Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe://Qmeg4GWWFxzJehEZVD12fLcuCARBsuKxVHNFxJGxXiiJs2'
  },
  proof: {
    valid: true,
    invalid: false,
    signature: 'e51bdf7b5d9c7e43d706e63a9b278760dca7bc1a203208dea52664ab4d09c4f932166e423c421c56c5d882f7040f4d31ddb92889bd377ed3e6fa0a09161d1666',
    key: '#zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs'
  }
}
```


### Publishing that local Perspective by turning it into a Neighbourhood
The back-bone of a Neighbourhood is a *LinkLanguage* - a Language that enables the sharing
and thus synchronizing of links (see `LinksAdapter` in [Language.ts](src/language/Language.ts)). 
While there can and should be many different implementations
with different trade-offs and features (like membranes etc.),
there currently is one fully implemented and Holochain based LinkLanguage with the name *Social Context*.

It is deployed on the current test network (Language Language v0.0.5) under the address:
`QmTK51rVNtKvp9vxDNczmiX3MuW1o3wprxg7w9McTLoMAk`.

#### Creating our unique LinkLanguage clone through templating
But we should not just use this publicly known Language as the back-bone for our new Neighbourhood,
since we need a unique clone.
So what we want is to use this existing Language as a template and create a new copy with the same code
but different UUID and/name in order to create a fresh space for our new Neighbourhood.

What parameters can we adjust when using it as template?
Let's have a look at the Language's meta information:

```
$ ad4m languages meta QmZ1mkoY8nLvpxY3Mizx8UkUiwUzjxJxsqSTPPdH8sHxCQ

=>
 {
  name: 'social-context',
  address: 'QmZ1mkoY8nLvpxY3Mizx8UkUiwUzjxJxsqSTPPdH8sHxCQ',
  description: 'Holochain based LinkLanguage. First full implementation of a LinkLanguage, for collaborative Neighbourhoods where every agent can add links. No membrane. Basic template for all custom Neighbourhoods in this first iteration of the Perspect3vism test network.',
  author: 'did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n',
  templated: false,
  templateSourceLanguageAddress: null,
  templateAppliedParams: null,
  possibleTemplateParams: [ 'uuid', 'name', 'description' ],
  sourceCodeLink: 'https://github.com/juntofoundation/Social-Context'
}
```

The field `possibleTemplateParams` tells us that we can set a `UUID` and override `name` and `description`.
Let's leave description but change the name.
The function `languages.applyTemplateAndPublish()` takes an object as JSON as second parameter like so:


```
ad4m languages applyTemplateAndPublish QmZ1mkoY8nLvpxY3Mizx8UkUiwUzjxJxsqSTPPdH8sHxCQ "{\"uuid\": \"84a329-77384c-1510fb\", \"name\": \"Social Context clone for demo Neighbourhood\"}"

=>
 {
  name: 'Social Context clone for demo Neighbourhood',
  address: 'QmYS6BSJQyy3NpgCPYUn5x9mzUDQRA7GURvwqcScZX8Vyg'
}
```


This has created and published a new language with the address `QmYS6BSJQyy3NpgCPYUn5x9mzUDQRA7GURvwqcScZX8Vyg`.

Let's have a look at its meta information:

```
ad4m languages meta QmYS6BSJQyy3NpgCPYUn5x9mzUDQRA7GURvwqcScZX8Vyg

=>
 {
  name: 'Social Context clone for demo Neighbourhood',
  address: 'QmYS6BSJQyy3NpgCPYUn5x9mzUDQRA7GURvwqcScZX8Vyg',
  description: 'Holochain based LinkLanguage. First full implementation of a LinkLanguage, for collaborative Neighbourhoods where every agent can add links. No membrane. Basic template for all custom Neighbourhoods in this first iteration of the Perspect3vism test network.',
  author: 'did:key:zQ3shfVkx4i9CigdakFkyAG3A4CsD7pMSwPzW3Hse6zUsUAjq',
  templated: true,
  templateSourceLanguageAddress: 'QmZ1mkoY8nLvpxY3Mizx8UkUiwUzjxJxsqSTPPdH8sHxCQ',
  templateAppliedParams: '{"name":"Social Context clone for demo Neighbourhood","uuid":"84a329-77384c-1510fb"}',
  possibleTemplateParams: [ 'uuid', 'name', 'description' ],
  sourceCodeLink: 'https://github.com/juntofoundation/Social-Context'
}

```

So this new Language knows that it was templated, how that happened (which parameters) and what the source was.
This is important because it enables other agents to trust this Language when they install it, given that they trust
the source.
Installing a Language (also LinkLanguages) means running foreign code on your computer.

As we can see in the meta information of the source `social-context`, it was authored by 
`did:key:zQ3shkkuZLvqeFgHdgZgFMUx8VGkgVWsLA83w2oekhZxoCW2n`.
This is the officil Perspect3vism agent who is registered as a "trusted agent" on all our deployments.
Before installing a new Language, the ad4m-executor will check if the author is in the list of trusted agents.
If not, and if the Language was templated, it will check if the template source's author is trusted.
If that is the case, it will apply the template parameters locally and if the resulting file has the same hash
as the Language that is about to get installed, it will install it automatically.
(If all these checks fail, it will currently bail, but we'll add a mechanism that prompts the user)

You can always add agent's to the list of "trusted agents" like so:
```
ad4m runtime addTrustedAgent did:something:something
```

#### Creating a Neighbourhood with our fresh LinkLanguage

We can now use this new LinkLanguage in our Neighbourhood.
`neighbourhood publishFromPerspective` takes 3 parameters
1. UUID of perspective to publish
2. address of LinkLanguage to use as Neighbourhoods synchronisation back-bone
3. A Perspective JSON object that is used for meta information in the immutable neighbourhood object (can be empty like below)
```
ad4m neighbourhood publishFromPerspective 2f168edc-363b-4d3b-818c-48b1f98b714b QmYS6BSJQyy3NpgCPYUn5x9mzUDQRA7GURvwqcScZX8Vyg "{\"links\":[]}"

=>
 'neighbourhood://QmP8ne8CBMFJSEnb4wqsc4D53f4exnYUsGA4YxqwEEbzbN'

```

It returns the Neighbourhood URL that can be shared and used to join the Neighbourhood.

### Joining a Neighbourhood (on another node/agent)
Assume everything above happened on Alice's agent.
Alice now shares the Neighbourhood's URL with Bob.
This is what Bob does to join the Neigbourhood, access it as a (local) Perspective
and retrieve the Expression Alice created and linked there:
```
ad4m neighbourhood joinFromUrl neighbourhood://QmP8ne8CBMFJSEnb4wqsc4D53f4exnYUsGA4YxqwEEbzbN

=>
 {
  uuid: 'e7f5c28a-9ceb-4e49-aea5-252a3bd5b4da',
  name: '',
  sharedUrl: 'neighbourhood://QmP8ne8CBMFJSEnb4wqsc4D53f4exnYUsGA4YxqwEEbzbN',
  neighbourhood: {
    linkLanguage: 'QmapZQzgif7P6EtTUkmu53157VmoYg65c9en2De9mz7Rnk',
    meta: { links: [] }
  }
}
```

This has created a new local perspective which is entangled (through the LinkLanguage) with Alice's one.
Bob should see the link Alice added in is local perspective:

```
ad4m perspective queryLinks e7f5c28a-9ceb-4e49-aea5-252a3bd5b4da {}

=>
 [
  {
    author: 'did:key:zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs',
    timestamp: '2021-08-25T20:08:23.603Z',
    data: {
      source: 'root',
      predicate: '',
      target: 'Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe://Qmeg4GWWFxzJehEZVD12fLcuCARBsuKxVHNFxJGxXiiJs2'
    },
    proof: {
      valid: true,
      invalid: false,
      signature: 'e51bdf7b5d9c7e43d706e63a9b278760dca7bc1a203208dea52664ab4d09c4f932166e423c421c56c5d882f7040f4d31ddb92889bd377ed3e6fa0a09161d1666',
      key: '#zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs'
    }
  }
]
```

With this link, Bob can get the expression Alice has created:

```
ad4m expression get Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe://Qmeg4GWWFxzJehEZVD12fLcuCARBsuKxVHNFxJGxXiiJs2

=>
 {
  author: 'did:key:zQ3shu6ft538azH7YodNZvMxz3C1DoKYuREJ2b75p84EfD1zs',
  timestamp: '2021-08-25T19:53:14.821Z',
  data: '"This is a test note"',
  language: { address: 'Qmd6AZzLjfGWNAqWLGTGy354JC1bK26XNf7rTEEsJfv7Fe' },
  proof: { valid: true, invalid: null }
}
```