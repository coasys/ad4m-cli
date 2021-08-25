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
npm install -g @perspect3vism/ad4m-client
```

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
and thus synchronizing of links (see `LinksAdapter` in [Language.ts](src/language/Language.ts)). While there can and should be many different implementations
with different trade-offs and features (like membranes etc.) the go-to implementation for now
is *Social Context* from Junto: https://github.com/juntofoundation/Social-Context,
which is currently included in all deployments and test of ad4m-executor and ad4m-cli.
The postinstall script donwloads the latest build to `src/builtin-langs/social-context`.


Before creating a new Neighbourhood we got to clone the generic social-context language to instantiate one
only for this Neighbourhood:

```
ad4m languages cloneHolochainTemplate /home/lucksus/ad4m-cli/src/builtin-langs/social-context social-context UUID-for-new-Neighbourhood

=>
 {
  name: 'social-context',
  address: 'QmapZQzgif7P6EtTUkmu53157VmoYg65c9en2De9mz7Rnk'
}
```

This has created and published a new language with the address `QmapZQzgif7P6EtTUkmu53157VmoYg65c9en2De9mz7Rnk`.

We can now use this new LinkLanguage in our Neighbourhood.
neighbourhood publishFromPerspective takes 3 parameters
1. UUID of perspective to publish
2. address of LinkLanguage to use as Neighbourhoods synchronisation back-bone
3. A Perspective JSON object that is used for meta information in the immutable neighbourhood object (can be empty like below)
```js
ad4m neighbourhood publishFromPerspective 2f168edc-363b-4d3b-818c-48b1f98b714b QmapZQzgif7P6EtTUkmu53157VmoYg65c9en2De9mz7Rnk "{\"links\":[]}"

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