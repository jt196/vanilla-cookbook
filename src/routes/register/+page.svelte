<form method="POST">
	<hgroup>
		<h2>Register</h2>
		<h3>To post articles, you'll need an account.</h3>
	</hgroup>

	<label for="name">Name</label>
	<input type="text" id="name" name="name" required />

	<label for="username">Username</label>
	<input type="text" id="username" name="username" required />

	<label for="email">Email</label>
	<input type="text" id="email" name="email" required />

	<label for="about">About</label>
	<input type="text" id="about" name="about" required />

	<label for="password">Password</label>
	<input type="password" id="password" name="password" required />

	<button type="submit">Register</button>
</form>
<p>Already have an account? <a href="/login">Login</a></p>
