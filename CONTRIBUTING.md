# Contributing to Zcash-Mina Bridge

Thank you for your interest in contributing! This is a research project and we welcome contributions of all kinds.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/zypherpunk.git
   cd zypherpunk
   ```
3. **Install dependencies**
   ```bash
   bun install
   cd zcash-sim && bun install && cd ..
   cd relayer && bun install && cd ..
   cd mina-snark && bun install && cd ..
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Tests

```bash
# Run all tests
bun test

# Run specific workspace tests
cd zcash-sim && bun test
cd relayer && bun test
cd mina-snark && bun test

# Run E2E tests
bun run test:e2e
```

### Code Style

- Use TypeScript for all new code
- Follow existing code style
- Add JSDoc comments for public APIs
- Use meaningful variable names

### Commit Messages

Follow conventional commits:

```
feat: add batch proof generation
fix: resolve Merkle proof verification bug
docs: update architecture documentation
test: add integration tests for relayer
refactor: simplify proof generation logic
```

## Types of Contributions

### 🐛 Bug Reports

- Use GitHub Issues
- Include reproduction steps
- Provide error messages and logs
- Specify your environment (OS, Bun version, etc.)

### 💡 Feature Requests

- Describe the use case
- Explain why it's useful
- Consider implementation complexity
- Discuss alternatives

### 🔧 Code Contributions

#### Priority Areas

1. **Real Zcash Integration**
   - Replace simulator with actual Zcash RPC
   - Implement proper commitment tracking
   - Add nullifier handling

2. **Circuit Optimization**
   - Improve proof generation speed
   - Reduce circuit size
   - Add batch verification

3. **Relayer Improvements**
   - Add retry logic
   - Implement persistent storage
   - Add monitoring and metrics

4. **Testing**
   - Increase test coverage
   - Add property-based tests
   - Implement fuzzing

5. **Documentation**
   - Improve API documentation
   - Add tutorials
   - Create diagrams

### 📝 Documentation

- Fix typos and clarify explanations
- Add code examples
- Create tutorials
- Improve README files

## Pull Request Process

1. **Update tests**
   - Add tests for new features
   - Ensure all tests pass
   - Maintain or improve coverage

2. **Update documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update ARCHITECTURE.md for major changes

3. **Create PR**
   - Use descriptive title
   - Reference related issues
   - Explain what and why
   - Include screenshots if relevant

4. **Review process**
   - Address review comments
   - Keep PR focused and small
   - Rebase on main if needed

## Code Review Guidelines

### For Contributors

- Be open to feedback
- Respond to comments promptly
- Ask questions if unclear
- Keep discussions professional

### For Reviewers

- Be constructive and kind
- Explain the "why" behind suggestions
- Approve when ready
- Test changes locally when possible

## Testing Guidelines

### Unit Tests

```typescript
import { describe, test, expect } from 'bun:test';

describe('MerkleTree', () => {
  test('should insert commitment', () => {
    const tree = new MerkleTree(32);
    const index = tree.insert('0x123...');
    expect(index).toBe(0);
  });
});
```

### Integration Tests

```typescript
test('should process deposit end-to-end', async () => {
  // 1. Create deposit
  const deposit = await createDeposit();
  
  // 2. Generate proof
  const proof = await generateProof(deposit);
  
  // 3. Submit to Mina
  const result = await submitProof(proof);
  
  expect(result.success).toBe(true);
});
```

## Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email security@zypherpunk.dev (if available)
2. Provide detailed description
3. Include reproduction steps
4. Allow time for fix before disclosure

### Security Considerations

When contributing:
- Never commit private keys
- Validate all inputs
- Use secure random number generation
- Follow cryptographic best practices
- Consider timing attacks
- Review dependencies

## Architecture Decisions

For significant changes:

1. **Open an issue first**
   - Discuss the approach
   - Get feedback early
   - Avoid wasted effort

2. **Consider backwards compatibility**
   - Don't break existing APIs
   - Provide migration path
   - Document breaking changes

3. **Think about performance**
   - Benchmark critical paths
   - Consider memory usage
   - Optimize hot paths

## Resources

### Learning Resources

- [Zcash Documentation](https://z.cash/developers/)
- [Mina Protocol Docs](https://docs.minaprotocol.com/)
- [o1js Tutorial](https://docs.minaprotocol.com/zkapps/tutorials)
- [Zero-Knowledge Proofs](https://zkp.science/)

### Development Tools

- [Bun Documentation](https://bun.sh/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

## Community

### Communication

- GitHub Issues: Bug reports and features
- GitHub Discussions: General questions
- Pull Requests: Code review

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions
- No harassment or discrimination

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open a GitHub Discussion
- Check existing issues
- Review documentation

Thank you for contributing! 🎉

