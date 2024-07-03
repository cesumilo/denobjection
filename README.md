# Early access

Denojection is a port of [Objection.js](https://github.com/Vincit/objection.js) to a TypeScript-native format, with additional improvements and fixes. Although Objection.js is [no longer actively maintained](https://github.com/Vincit/objection.js/discussions/2463), we have decided to fork the project and continue its development using Deno. Denojection will be compatible with both Node and Deno.

> ⚠️ Denobjection is still in an early stage of development and clearly not production ready.

# [Denobjection](#)

Denobjection is an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) for [Deno](https://deno.com/) and [Node.js](https://nodejs.org/) that aims to stay out of your way and make it as easy as possible to use the full power of SQL and the underlying database engine while still making the common stuff easy and enjoyable.

Even though ORM is the best commonly known acronym to describe objection, a more accurate description is to call it **a relational query builder**. You get all the benefits of an SQL query builder but also a powerful set of tools for working with relations.

Deobjection is built on an SQL query builder called [knex](http://knexjs.org). All databases supported by knex are supported by Denobjection.