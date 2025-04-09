<html>
<head>
<title>Sanity.test.jsx</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style type="text/css">
.s0 { color: #bcbec4;}
.s1 { color: #bcbec4;}
.s2 { color: #6aab73;}
.s3 { color: #d5b778;}
</style>
</head>
<body bgcolor="#1e1f22">
<table CELLSPACING=0 CELLPADDING=5 COLS=1 WIDTH="100%" BGCOLOR="#606060" >
<tr><td><center>
<font face="Arial, Helvetica" color="#000000">
Sanity.test.jsx</font>
</center></td></tr></table>
<pre><span class="s0">test</span><span class="s1">(</span><span class="s2">'Jest is working'</span><span class="s1">, () =&gt; {</span>
    <span class="s0">render</span><span class="s1">(</span><span class="s3">&lt;div&gt;</span><span class="s0">Hello, test!</span><span class="s3">&lt;/div&gt;</span><span class="s1">);</span>
    <span class="s0">expect</span><span class="s1">(</span><span class="s0">screen</span><span class="s1">.</span><span class="s0">getByText</span><span class="s1">(</span><span class="s2">'Hello, test!'</span><span class="s1">)).</span><span class="s0">toBeInTheDocument</span><span class="s1">();</span>
<span class="s1">});</span></pre>
</body>
</html>