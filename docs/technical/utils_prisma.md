# Utility Functions – Prisma

## prismaAdmin.js

### Function 1

## Admin CLI Utility

This file provides command line administrative functions for managing the application's database.
It leverages Prisma and Lucia for user and session management.

### Available Commands

- **deleteUser `<user-id>`**: Deletes a user from the database by their unique ID.
- **updatePassword `<username>` `<new-password>`**: Updates a user's password.
- **disconnect**: Deletes all sessions and disconnects from the database.

### Usage Examples

- To delete a user:

```bash
pnpm node admin.js deleteUser <user-id>
```

- To update a user's password:

```bash
pnpm node admin.js updatePassword <username> <new-password>
```

- To disconnect from the database (clean up sessions):

```bash
pnpm node admin.js disconnect
```

Ensure you have the correct environment and database configuration before running these commands.


## prismaUtils.js

### deleteAndDisconnect

Deletes all auth sessions and disconnects from the database.

This function is used by the updatePassword and deleteUser functions.

deleted and the database has been disconnected.

#### Returns

| Type | Description |
| --- | --- |
| `{Promise<void>}` | A promise that resolves when all sessions have been |

### updatePassword

Updates a user's password in Lucia

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| username | `{string}` | The username of the user whose password is to be updated. |
| newPassword | `{string}` | The new password to set for the user. |

#### Returns

| Type | Description |
| --- | --- |
| `{Promise<void>}` | A promise that resolves when the password has been updated. |

### deleteUser

Deletes a user from the authUser table, as well as all associated sessions and auth keys.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| userId | `{string}` |  |

#### Returns

| Type | Description |
| --- | --- |
| `{Promise<PrismaClientPkg.authUser>}` | The deleted user. |

#### Throws

| Type | Description |
| --- | --- |
| `{Error}` | If there is an error deleting the user. |
