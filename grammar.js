module.exports = grammar({
  name: "bql",

  extras: ($) => [/\s/],

  rules: {
    source_file: ($) => repeat($._statement),

    _statement: ($) => $.select_statement,

    select_statement: ($) =>
      seq(
        $.keyword_select,
        $._select_list,
      ),

    _select_list: ($) => choice($.asterisk, seq($.column_name, repeat(seq(",", $.column_name)))),

    asterisk: (_) => "*",

    column_name: ($) => $.identifier,

    keyword_select: (_) => /[Ss][Ee][Ll][Ee][Cc][Tt]/,

    identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});
