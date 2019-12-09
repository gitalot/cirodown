const assert = require('assert');
const util = require('util');

const cirodown = require('cirodown')

const convert_opts = {
  body_only: true,
  //show_ast: true,
  //show_parse: true,
  //show_tokens: true,
  //show_tokenize: true,
};

const assert_convert_func = function(input_string, expected_output) {
  let extra_returns = {};
  let output = cirodown.convert(input_string, convert_opts, extra_returns);
  if (output !== expected_output || extra_returns.errors.length !== 0) {
    console.error('tokens:');
    console.error(JSON.stringify(extra_returns.tokens, null, 2));
    console.error();
    console.error('ast:');
    console.error(JSON.stringify(extra_returns.ast, null, 2));
    console.error();
    for (const error of extra_returns.errors) {
      console.error(error.toString());
    }
    console.error('input ' + util.inspect(input_string));
    console.error('output ' + util.inspect(output));
    console.error('expect ' + util.inspect(expected_output));
    assert.strictEqual(output, expected_output);
    assert.strictEqual(extra_returns.errors.length, 0);
  }
}

const assert_error_func = function(input_string, line, column) {
  let extra_returns = {};
  let output = cirodown.convert(input_string, convert_opts, extra_returns);
  assert.ok(extra_returns.errors.length >= 1);
  let error = extra_returns.errors[0];
  assert.strictEqual(error.line, line);
  assert.strictEqual(error.column, column);
}

const assert_convert = function(description, input, output) {
  it(description, ()=>{assert_convert_func(input, output);});
}

const assert_error = function(description, input, line, column) {
  it(description, ()=>{assert_error_func(input, line, column);});
}

/** For stuff that is hard to predict the exact output of, just check the
 * exit status at least. */
const assert_no_error = function(description, input) {
  it(description, ()=>{
    let extra_returns = {};
    cirodown.convert(input, convert_opts, extra_returns);
    assert.strictEqual(extra_returns.errors.length, 0);
  });
}
// Paragraphs.
assert_convert('one paragraph', '\\p[ab]\n', '<p>ab</p>\n');
assert_convert('two paragraphs', 'p1\n\np2\n', '<p>p1</p>\n<p>p2</p>\n');
assert_convert('three paragraphs',
  'p1\n\np2\n\np3\n',
  '<p>p1</p>\n<p>p2</p>\n<p>p3</p>\n'
);

// List.
assert_convert('l with explicit ul',
  `ab

\\ul[
\\l[cd]
\\l[ef]
]

gh
`,
  `<p>ab</p>
<ul>
<li>cd</li>
<li>ef</li>
</ul>
<p>gh</p>
`
);
assert_convert('l with implicit ul',
  `ab

\\l[cd]
\\l[ef]

gh
`,
  `<p>ab</p>
<ul>
<li>cd</li>
<li>ef</li>
</ul>
<p>gh</p>
`
);
assert_convert('ordered list',
  `ab

\\ol[
\\l[cd]
\\l[ef]
]

gh
`,
  `<p>ab</p>
<ol>
<li>cd</li>
<li>ef</li>
</ol>
<p>gh</p>
`
);

// Table.
assert_convert('tr with explicit table',
  `ab

\\table[
\\tr[
\\th[cd]
\\th[ef]
]
\\tr[
\\td[00]
\\td[01]
]
\\tr[
\\td[10]
\\td[11]
]
]

gh
`,
  `<p>ab</p>
<div class="table-container">
<table>
<tr>
<th>cd</th>
<th>ef</th>
</tr>
<tr>
<td>00</td>
<td>01</td>
</tr>
<tr>
<td>10</td>
<td>11</td>
</tr>
</table>
</div>
<p>gh</p>
`
);
assert_convert('tr with implicit table',
  `ab

\\tr[
\\th[cd]
\\th[ef]
]
\\tr[
\\td[00]
\\td[01]
]
\\tr[
\\td[10]
\\td[11]
]

gh
`,
  `<p>ab</p>
<div class="table-container">
<table>
<tr>
<th>cd</th>
<th>ef</th>
</tr>
<tr>
<td>00</td>
<td>01</td>
</tr>
<tr>
<td>10</td>
<td>11</td>
</tr>
</table>
</div>
<p>gh</p>
`
);
assert_convert('auto_parent consecutive implicit tr and l',
  `\\tr[\\td[ab]]
\\l[cd]
`,
  `<div class="table-container">
<table>
<tr>
<td>ab</td>
</tr>
</table>
</div>
<ul>
<li>cd</li>
</ul>
`
);
assert_convert('table with id has caption',
  `\\table{id=ab}[
\\tr[
\\td[00]
\\td[01]
]
]
`,
  `<div class="table-container" id="ab">
<div class="table-caption">Table 1</div>
<table>
<tr>
<td>00</td>
<td>01</td>
</tr>
</table>
</div>
`
);

// Images.
assert_convert('image simple',
  `ab

\\Image[cd]

gh
`,
  `<p>ab</p>
<figure>
<img src="cd">
</figure>
<p>gh</p>
`
)
assert_convert('image title',
  `\\Image[ab]{title=c d}`,
  `<figure id="image-c-d">
<a href="#image-c-d"><img src="ab"></a>
<figcaption>Image 1. c d</figcaption>
</figure>
`
)
assert_convert('image without id does not increment image count',
  `\\Image[ab]
\\Image[cd]{id=ef}
`,
  `<figure>
<img src="ab">
</figure>
<figure id="ef">
<a href="#ef"><img src="cd"></a>
<figcaption>Image 1</figcaption>
</figure>
`
)

// Escapes.
assert_convert('escape backslash',            'a\\\\b\n', 'a\\b\n');
assert_convert('escape left square bracket',  'a\\[b\n',  'a[b\n');
assert_convert('escape right square bracket', 'a\\]b\n',  'a]b\n');
assert_convert('escape left curly brace',     'a\\{b\n',  'a{b\n');
assert_convert('escape right curly brace',    'a\\}b\n',  'a}b\n');

// HTML Escapes.
assert_convert('html escapes',
  '\\a[ab&<>"\'cd][ef&<>"\'gh]\n',
  '<a href="ab&amp;&lt;&gt;&quot;&#039;cd">ef&amp;&lt;&gt;"\'gh</a>\n'
);

// Positional arguments.
assert_convert('p with no content argument', '\\p\n', '<p></p>\n');
assert_convert('p with empty content argument', '\\p[]\n', '<p></p>\n');

// Named arguments.
assert_convert('p with id before', '\\p{id=ab}[cd]\n', '<p id="ab">cd</p>\n');
assert_convert('p with id after', '\\p[cd]{id=ab}\n', '<p id="ab">cd</p>\n');

// Literal arguments.
assert_convert('literal argument code inline',
  '\\c[[\\ab[cd]{ef}]]\n',
  '<code>\\ab[cd]{ef}</code>\n'
);
assert_convert('literal argument code block',
  `a

\\C[[
\\[]{}
\\[]{}
]]

d
`,
  `<p>a</p>
<pre><code>\\[]{}
\\[]{}
</code></pre>
<p>d</p>
`
);
assert_convert("non-literal argument leading newline gets removed",
  `\\p[
a
b
]
`,
  `<p>a
b
</p>
`
);
assert_convert('literal argument leading newline gets removed',
  `\\p[[
a
b
]]
`,
  `<p>a
b
</p>
`
);
assert_convert('literal argument leading newline gets removed but not second',
  `\\p[[

a
b
]]
`,
  `<p>
a
b
</p>
`
);
assert_convert('literal agument escape leading open no escape',
  '\\c[[\\ab]]\n',
  '<code>\\ab</code>\n'
);
assert_convert('literal agument escape leading open one backslash',
  '\\c[[\\[ab]]\n',
  '<code>[ab</code>\n'
);
assert_convert('literal agument escape leading open two backslashes',
  '\\c[[\\\\[ab]]\n',
  '<code>\\[ab</code>\n'
);
assert_convert('literal agument escape trailing close no escape',
  '\\c[[\\]]\n',
  '<code>\\</code>\n'
);
assert_convert('literal agument escape trailing one backslash',
  '\\c[[\\]]]\n',
  '<code>]</code>\n'
);
assert_convert('literal agument escape trailing two backslashes',
  '\\c[[\\\\]]]\n',
  '<code>\\]</code>\n'
);

// Links.
assert_convert('link simple',
  'a \\a[http://example.com][example link] b\n',
  'a <a href="http://example.com">example link</a> b\n'
);
assert_convert('link auto',
  'a \\a[http://example.com] b\n',
  'a <a href="http://example.com">http://example.com</a> b\n'
);
assert_convert('link with multiple paragraphs',
  '\\a[http://example.com][Multiple\n\nparagraphs]\n',
  '<a href="http://example.com"><p>Multiple</p>\n<p>paragraphs</p>\n</a>\n'
);

// Cross references \x
assert_convert('cross reference simple',
  `\\h[1][My header]

\\x[my-header][link body]
`,
  `<h1 id="my-header"><a href="#my-header">1. My header</a></h1>
<p><a href="#my-header">link body</a></p>
`
);
assert_convert('cross reference auto default',
  `\\h[1][My header]

\\x[my-header]
`,
  `<h1 id="my-header"><a href="#my-header">1. My header</a></h1>
<p><a href="#my-header">My header</a></p>
`
);
assert_convert('cross reference auto style full',
  `\\h[1][My header]

\\x[my-header]{style=full}
`,
  `<h1 id="my-header"><a href="#my-header">1. My header</a></h1>
<p><a href="#my-header">Section 1. "My header"</a></p>
`
);
assert_error('cross reference with unknown style',
  `\\h[1][My header]

\\x[my-header]{style=reserved_undefined}
`,
  3, 21
);
assert_convert('cross reference to image',
  `\\Image[ab]{id=cd}{title=ef}

\\x[cd]
`,
  `<figure id="cd">
<a href="#cd"><img src="ab"></a>
<figcaption>Image 1. ef</figcaption>
</figure>
<p><a href="#cd">Image 1. "ef"</a></p>
`
);
assert_convert('cross reference without content nor target title style full',
  `\\Image[ab]{id=cd}

\\x[cd]
`,
  `<figure id="cd">
<a href="#cd"><img src="ab"></a>
<figcaption>Image 1</figcaption>
</figure>
<p><a href="#cd">Image 1</a></p>
`
);
assert_error('cross reference undefined', '\\x[ab]', 1, 4);
assert_error('cross reference without content nor target title style short',
  `\\Image[ab]{id=cd}

\\x[cd]{style=short}
`, 3, 2);

// Headers.
assert_convert('header simple',
  '\\h[1][My header]\n',
  `<h1 id="my-header"><a href="#my-header">1. My header</a></h1>\n`
);
assert_convert('header and implicit paragraphs',
  `\\h[1][My header 1]

My paragraph 1.

\\h[2][My header 2]

My paragraph 2.
`,
  `<h1 id="my-header-1"><a href="#my-header-1">1. My header 1</a></h1>
<p>My paragraph 1.</p>
<h2 id="my-header-2"><a href="#my-header-2">2. My header 2</a></h2>
<p>My paragraph 2.</p>
`
);
assert_convert('header 7',
  `\\h[1][1]
\\h[2][2]
\\h[3][3]
\\h[4][4]
\\h[5][5]
\\h[6][6]
\\h[7][7]
`,
  `<h1 id="1"><a href="#1">1. 1</a></h1>
<h2 id="2"><a href="#2">2. 2</a></h2>
<h3 id="3"><a href="#3">3. 3</a></h3>
<h4 id="4"><a href="#4">4. 4</a></h4>
<h5 id="5"><a href="#5">5. 5</a></h5>
<h6 id="6"><a href="#6">6. 6</a></h6>
<h6 data-level="7" id="7"><a href="#7">7. 7</a></h6>
`
);
assert_error('header must be an integer', '\\h[a][b]\n', 1, 4);
assert_error('header must not be zero', '\\h[0][b]\n', 1, 4);
assert_error('header skip level is an error', '\\h[1][a]\n\\h[3][b]\n', 2, 4);

// Code.
assert_convert('code inline',
  'a \\c[b c] d\n',
  'a <code>b c</code> d\n'
);
assert_convert('code block simple',
  `a

\\C[[
b
c
]]

d
`,
  `<p>a</p>
<pre><code>b
c
</code></pre>
<p>d</p>
`
);

// Math.
assert_no_error('math inline', '\\m[[\\sqrt{1 + 1}]]');
assert_no_error('math block', '\\M[[\\sqrt{1 + 1}]]');
assert_error('math undefined macro', '\\m[[\\reserved_undefined]]', 1, 5);

// Errors. Check that they return gracefully with the error line number,
// rather than blowing up an exception.
// TODO
//assert_error('backslash without macro', '\\ a', 1, 1);
assert_error('unknown macro', '\\reserved_undefined', 1, 2);
assert_error('too many positional arguments', '\\p[ab][cd]', 1, 7);
assert_error('unknown named macro argument', '\\c{reserved_undefined=abc}[]', 1, 4);
assert_error('named argument without =', '\\p{id ab}[cd]', 1, 6);
//assert_error('argument without close', '\\p[', 1, 3);
//assert_error('argument without open', ']', 1, 1);
//assert_error('unterminated literal argument', '\\c[[ab]', 1, 3;