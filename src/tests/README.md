# Running the tests

If you're planning to run the whole suite of tests, some of them are going to fail unless the server is running and configured correctly.

1. Ensure that the `ORIGIN` env variable in the _.env_ is correctly configured
2. `pnpm dev` in the terminal
3. Open another terminal window, making sure not to quit the dev server
4. `pnpm test`

If you're running the tests on the nodemon server, be sure to change the environment variable to `http://localhost:3000`
