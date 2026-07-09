# Flask App Builder Skill - Iteration 1 Benchmark

## Summary

| Configuration | Pass Rate | Avg Tokens | Avg Duration |
|---------------|-----------|------------|--------------|
| **with_skill** | 100% (3/3) | 48,333 | 88.3s |
| **without_skill** | 67% (2/3) | 40,000 | 80.0s |
| **Delta** | +33% | +8,333 | +8.3s |

## Per-Eval Results

### Eval 1: Simple Web App
| Config | Passed | Total | Tokens | Duration |
|--------|--------|-------|--------|----------|
| with_skill | 5 | 5 | 45,000 | 85s |
| without_skill | 5 | 5 | 40,000 | 80s |

### Eval 2: REST API
| Config | Passed | Total | Tokens | Duration |
|--------|--------|-------|--------|----------|
| with_skill | 5 | 5 | 52,000 | 92s |
| without_skill | 5 | 5 | 42,000 | 85s |

### Eval 3: Contact Form
| Config | Passed | Total | Tokens | Duration |
|--------|--------|-------|--------|----------|
| with_skill | 6 | 6 | 48,000 | 88s |
| without_skill | 0 | 6 | 38,000 | 75s |

## Key Findings

1. **Simple tasks**: Skill and baseline perform similarly
2. **Complex tasks**: Skill provides significant value (contact form: 100% vs 0%)
3. **Token overhead**: Skill uses ~8K more tokens on average (acceptable for quality improvement)
4. **Duration overhead**: Skill takes ~8s longer on average (acceptable for quality improvement)

## Recommendations

- The skill is performing well, especially for complex tasks
- Consider adding more guidance for simple prototypes to reduce overhead
- CSRF protection and form validation guidance are key differentiators