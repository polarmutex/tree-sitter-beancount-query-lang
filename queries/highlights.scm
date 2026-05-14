[
  (keyword_select)
  (keyword_distinct)
  (keyword_from)
  (keyword_where)
  (keyword_group)
  (keyword_by)
  (keyword_order)
  (keyword_asc)
  (keyword_desc)
  (keyword_limit)
  (keyword_open)
  (keyword_close)
  (keyword_clear)
  (keyword_on)
  (keyword_at)
  (keyword_journal)
  (keyword_balances)
  (keyword_print)
  (keyword_explain)
] @keyword

(function_call name: (identifier) @function)

(binary_expression ["=" "!=" "<" "<=" ">" ">="] @operator)
(regex_expression "~" @operator)

(identifier) @variable
(string) @string
(date) @function
[(integer) (decimal)] @number
[(boolean) (null)] @constant.builtin

"AND" @keyword
"OR" @keyword
"NOT" @keyword
"IN" @keyword
