<html>
<head>
<title>sanity.cy.js</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<style type="text/css">
.s0 { color: #bcbec4;}
.s1 { color: #bcbec4;}
.s2 { color: #6aab73;}
.s3 { color: #7a7e85;}
</style>
</head>
<body bgcolor="#1e1f22">
<table CELLSPACING=0 CELLPADDING=5 COLS=1 WIDTH="100%" BGCOLOR="#606060" >
<tr><td><center>
<font face="Arial, Helvetica" color="#000000">
sanity.cy.js</font>
</center></td></tr></table>
<pre><span class="s0">describe</span><span class="s1">(</span><span class="s2">'Cypress is working'</span><span class="s1">, () =&gt; {</span>
    <span class="s0">it</span><span class="s1">(</span><span class="s2">'visits the local app and checks for something'</span><span class="s1">, () =&gt; {</span>
        <span class="s0">cy</span><span class="s1">.</span><span class="s0">visit</span><span class="s1">(</span><span class="s2">'http://localhost:5173'</span><span class="s1">); </span><span class="s3">// Make sure you're running `npm run dev`</span>
        <span class="s0">cy</span><span class="s1">.</span><span class="s0">contains</span><span class="s1">(</span><span class="s2">'Import'</span><span class="s1">).</span><span class="s0">should</span><span class="s1">(</span><span class="s2">'exist'</span><span class="s1">); </span><span class="s3">// Or change to any keyword in your app</span>
    <span class="s1">});</span>
<span class="s1">});</span>
</pre>
</body>
</html>