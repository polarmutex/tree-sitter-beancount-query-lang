# tree-sitter-bql

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the [Beancount Query Language (BQL)](https://beancount.github.io/docs/beancount_query_language/).

## Why

Beancount files can embed BQL strings inside `query` directives:

```beancount
2024-01-01 query "expenses" "SELECT account, SUM(position) WHERE account ~ 'Expenses' GROUP BY account"
```

The `tree-sitter-beancount` grammar injects these strings as the `bql` language. Without a grammar for `bql`, editors that support tree-sitter injections (Neovim, Helix, Zed) fall back to plain text — no syntax highlighting, no structured navigation, no AST.

This grammar registers under the `bql` injection language name, activating automatically for every `query` directive in `.beancount` files.

## Supported syntax

### Statements

| Statement    | Example |
|--------------|---------|
| `SELECT`     | `SELECT account, SUM(position) WHERE account ~ "Expenses"` |
| `JOURNAL`    | `JOURNAL "Expenses" AT cost FROM OPEN ON 2024-01-01` |
| `BALANCES`   | `BALANCES AT cost FROM CLOSE ON 2024-12-31` |
| `PRINT`      | `PRINT FROM year = 2024` |

### Clauses

- **FROM** — entry-filter expression and statement operators (`OPEN ON <date>`, `CLOSE [ON <date>]`, `CLEAR`)
- **WHERE** — posting-filter expression
- **GROUP BY** — positional integers or named column references
- **ORDER BY** — one or more columns with optional `ASC`/`DESC`
- **LIMIT** — integer row cap
- **DISTINCT** — deduplication on `SELECT`

### Expressions

- Comparisons: `=`, `!=`, `<`, `<=`, `>`, `>=`
- Regex match: `~`
- Set membership: `IN (...)`
- Logical: `AND`, `OR`, `NOT`
- Parenthesised expressions
- Function calls: `SUM(position)`, `COST(SUM(position))`
- Literals: strings, dates (`YYYY-MM-DD`), integers, decimals, `TRUE`/`FALSE`, `NULL`

Keywords are case-insensitive. Semicolons are optional.

## Installation

### npm

```sh
npm install tree-sitter-bql
```

### From source

```sh
git clone https://github.com/polarmutex/tree-sitter-beancount-query-lang
cd tree-sitter-beancount-query-lang
npm install
npm run build
```

### Editor setup

#### Neovim (nvim-treesitter)

Add to your nvim-treesitter config:

```lua
require("nvim-treesitter.parsers").get_parser_configs().bql = {
  install_info = {
    url = "https://github.com/polarmutex/tree-sitter-beancount-query-lang",
    files = { "src/parser.c" },
    branch = "main",
  },
  filetype = "bql",
}
```

The `tree-sitter-beancount` injection will activate it automatically for `query` directive strings.

#### Helix

Add to `languages.toml`:

```toml
[[language]]
name = "bql"
scope = "source.bql"
injection-regex = "^bql$"
grammar = "bql"

[[grammar]]
name = "bql"
source = { git = "https://github.com/polarmutex/tree-sitter-beancount-query-lang", rev = "main" }
```

## Development

### Prerequisites

- Node.js ≥ 22
- `tree-sitter-cli`

```sh
npm install
```

### Generate the parser

```sh
npm run build
# or: tree-sitter generate
```

### Run tests

```sh
npm test
# or: tree-sitter test
```

Corpus tests live in `test/corpus/`, one file per grammatical concern:

| File | Covers |
|------|--------|
| `select_basic.txt` | `SELECT *`, column list, `DISTINCT` |
| `select_functions.txt` | function calls, nested calls |
| `select_from.txt` | FROM filter, `OPEN ON`, `CLOSE ON`, `CLEAR` |
| `select_where.txt` | comparison, regex, `IN`, `AND`/`OR`/`NOT` |
| `select_group_by.txt` | positional and named `GROUP BY` |
| `select_order_by.txt` | single/multi-column `ORDER BY`, `ASC`/`DESC` |
| `select_limit.txt` | `LIMIT` |
| `journal_statement.txt` | `JOURNAL` with account-regexp and `AT` |
| `balances_statement.txt` | `BALANCES` with `AT` and `FROM` |
| `print_statement.txt` | `PRINT` with `FROM` |
| `literals.txt` | string, date, integer, decimal, boolean, NULL |
| `operators.txt` | operator precedence |
| `semicolon.txt` | with and without trailing semicolons |

## Grammar structure

- **`source_file`** — root node wrapping zero or more statements
- **`select_statement`**, **`journal_statement`**, **`balances_statement`**, **`print_statement`** — distinct named nodes per statement type
- **`_expression`** — hidden shared rule used in both `FROM` filter and `WHERE` positions
- **`function_call`** — `name` field + `arguments` field (parenthesised comma-separated expressions)
- **`from_clause`** — `filter` field (expression) and `operators` field (statement operators)
- **`select_targets`** — sequence of `select_target` nodes (`*`, identifier, or function call)

Operator precedence (low → high): `OR` < `AND` < `NOT` < comparisons / `IN` / `~`

## License

MIT
