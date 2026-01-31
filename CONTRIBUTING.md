# Contributing to LocalPlay

Thank you for your interest in contributing to LocalPlay! This document provides guidelines and information for contributors.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## How to Contribute

### Reporting Bugs

Found a bug? Please open an issue with:

1. **Clear title** - Describe the issue concisely
2. **Steps to reproduce** - How to trigger the bug
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment** - Browser, OS, LocalPlay version
6. **Screenshots** - If applicable

### Suggesting Features

Have an idea? Open an issue with:

1. **Use case** - Why is this feature needed?
2. **Proposed solution** - How should it work?
3. **Alternatives** - Other approaches considered?
4. **Additional context** - Mockups, examples, etc.

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add: Feature description"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/localplay.git
cd localplay

# Install dependencies
npm install

# Start development server
npm run dev

# Run in another terminal to test builds
npm run build
npm run preview
```

## Project Structure

```
localplay/
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utilities (parsing, storage)
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Static assets
└── index.html           # HTML template
```

## Coding Guidelines

### JavaScript/React

- Use functional components with hooks
- Follow existing code style (spaces, naming)
- Add comments for complex logic
- Keep components focused and reusable

### Example:

```javascript
// Good
const MyComponent = ({ data, onSelect }) => {
  const [state, setState] = useState(null);
  
  // Handle selection with validation
  const handleSelect = (item) => {
    if (!item) return;
    onSelect(item);
  };
  
  return <div onClick={handleSelect}>...</div>;
};

// Avoid
const MyComponent = (props) => {
  return <div onClick={() => props.onSelect(props.data)}>...</div>;
};
```

### CSS/Tailwind

- Use Tailwind utility classes
- Keep responsive (mobile-first approach)
- Use existing color scheme (gray-900, blue-600, etc.)
- Add custom CSS only when necessary

### File Naming

- Components: `PascalCase.jsx`
- Hooks: `camelCase.js` with `use` prefix
- Utils: `camelCase.js`

## Testing

Currently manual testing is sufficient. Future: automated tests.

**Test checklist:**
- [ ] Folder selection works
- [ ] Videos play correctly
- [ ] Progress saves and loads
- [ ] Keyboard shortcuts work
- [ ] Responsive on different screen sizes
- [ ] No console errors

## Areas for Contribution

### Easy (Good First Issues)

- Add more keyboard shortcuts
- Improve styling/animations
- Add loading states
- Better error messages
- Update documentation

### Medium

- Implement search functionality
- Add thumbnail generation
- Create playlist feature
- Add bookmarks/notes
- Improve mobile experience

### Advanced

- Cloud storage integration (iCloud, Google Drive)
- Video transcoding support
- Subtitle support
- Multi-language support
- Performance optimizations

## Commit Message Format

Use clear, descriptive commit messages:

```
Add: Feature description
Fix: Bug description
Update: Change description
Refactor: Code improvement
Docs: Documentation update
Style: Formatting change
```

Examples:
```
Add: Keyboard shortcut for playback speed
Fix: Progress not saving on video end
Update: Improve sidebar responsive design
Refactor: Extract video controls to separate component
Docs: Add deployment guide
Style: Format code with Prettier
```

## Pull Request Checklist

Before submitting:

- [ ] Code follows project style
- [ ] No console errors or warnings
- [ ] Tested in Chrome/Edge
- [ ] Responsive (desktop and mobile)
- [ ] Updated documentation if needed
- [ ] Commit messages are clear
- [ ] PR description explains changes

## Questions?

- Open an issue for discussion
- Check existing issues and PRs
- Review the README and documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making LocalPlay better!** 🎉
