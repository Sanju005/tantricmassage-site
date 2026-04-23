# Article Admin

This site now uses a local form-based article publishing tool.

## Start The Admin

Use one of these:

```bash
npm.cmd run article-admin
```

or

```bash
node scripts/article-admin-server.js
```

Then open:

```text
http://127.0.0.1:4173
```

## What The Form Publishes

- article page
- redirect page in `/blog/`
- hub card
- latest article first
- sitemap entry
- meta title and description
- canonical
- OG / Twitter tags
- BlogPosting schema
- optional Service schema from your schema box
- share buttons

## Form Fields

- hub
- publish date
- title
- slug
- H1
- subheading
- meta title
- meta description
- image URL/path
- image alt
- card excerpt
- tags
- content box
- schema JSON
