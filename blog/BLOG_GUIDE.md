# Adding Blog Posts

## Quick Start

1. **Create markdown file** in `blog/posts/`
2. **Add images** to `blog/images/`
3. **Update** `blog/blog-config.js`
4. Reload page - post appears!

## Step-by-Step

### 1. Write Your Post

Create `blog/posts/my-new-post.md`:

```markdown
# My Post Title

![Header Image](../images/my-image.jpg)

Your content here...

## Section

More content...
```

### 2. Add to Config

Edit `blog/blog-config.js`:

```javascript
{
    id: 'my-new-post',
    title: 'My Post Title',
    date: '2025-01-21',
    author: 'Your Name',
    file: 'my-new-post.md',
    excerpt: 'Short description...',
    tags: ['Tag1', 'Tag2']
}
```

### 3. Add Images

Put images in `blog/images/` and reference:
```markdown
![Alt text](../images/your-image.jpg)
```

## Image Paths

- **Local images**: `../images/filename.jpg`
- **External**: `https://example.com/image.jpg`

## Markdown Support

- Headers: `# ## ###`
- **Bold**: `**text**`
- *Italic*: `*text*`
- Links: `[text](url)`
- Images: `![alt](path)`
- Code: `` `inline` `` or ` ```block``` `
- Lists, quotes, tables, etc.

Done! 🎉
