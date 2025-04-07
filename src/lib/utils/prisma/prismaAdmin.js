/**
 * ## Admin CLI Utility
 *
 * This file provides command line administrative functions for managing the application's database.
 * It leverages Prisma and Lucia for user and session management.
 *
 * ### Available Commands
 *
 * - **deleteUser `<user-id>`**: Deletes a user from the database by their unique ID.
 * - **updatePassword `<username>` `<new-password>`**: Updates a user's password.
 * - **disconnect**: Deletes all sessions and disconnects from the database.
 *
 * ### Usage Examples
 *
 * - To delete a user:
 *
 *   ```bash
 *   pnpm node admin.js deleteUser <user-id>
 *   ```
 *
 * - To update a user's password:
 *
 *   ```bash
 *   pnpm node admin.js updatePassword <username> <new-password>
 *   ```
 *
 * - To disconnect from the database (clean up sessions):
 *
 *   ```bash
 *   pnpm node admin.js disconnect
 *   ```
 *
 * Ensure you have the correct environment and database configuration before running these commands.
 */

import { deleteUser, updatePassword, deleteAndDisconnect } from './prismaUtils.js'

// Parse command line arguments.
// process.argv[0] is node, process.argv[1] is the script name,
// process.argv[2] is the command, and the rest are additional arguments.
const [, , command, ...args] = process.argv

// Immediately Invoked Async Function Expression (IIFE)
// This pattern lets us use async/await at the top level.
;(async () => {
	try {
		switch (command) {
			case 'deleteUser':
				// Command: deleteUser
				// Usage: pnpm node admin.js deleteUser <user-id>
				if (!args[0]) {
					console.error('Usage: pnpm node admin.js deleteUser <user-id>')
					process.exit(1)
				}
				const userId = args[0]
				// Delete the user with the provided ID.
				const result = await deleteUser(userId)
				console.log('Deleted user:', result)
				break

			case 'updatePassword':
				// Command: updatePassword
				// Usage: pnpm node admin.js updatePassword <username> <new-password>
				if (args.length < 2) {
					console.error('Usage: pnpm node admin.js updatePassword <username> <new-password>')
					process.exit(1)
				}
				const [username, newPassword] = args
				// Update the password for the specified user.
				await updatePassword(username, newPassword)
				console.log(`Password updated for user: ${username}`)
				break

			case 'disconnect':
				// Command: disconnect
				// Usage: pnpm node admin.js disconnect
				// Deletes all sessions and disconnects from the database.
				await deleteAndDisconnect()
				console.log('Deleted all sessions and disconnected from the database.')
				break

			default:
				console.error('Unknown command. Available commands: deleteUser, updatePassword, disconnect')
		}
	} catch (error) {
		console.error('Error:', error)
	}
})()
