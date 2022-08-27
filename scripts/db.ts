import readline from 'readline';
import { Writable } from 'stream';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createUser } from '../src/lib/db/user';

type MutableWritable = Writable & { muted?: boolean };

const mutableStdout: MutableWritable = new Writable({
	write(this: MutableWritable, chunk, encoding, callback) {
		if (!this.muted) {
			process.stdout.write(chunk, encoding);
		}
		callback();
	}
});

yargs(hideBin(process.argv))
	.scriptName('db')
	.strict()
	.demandCommand()
	.help()
	.command(
		'add-user <username> <email>',
		'Add a user',
		(yargs) => {
			return yargs
				.positional('username', {
					describe: 'A username',
					demandOption: true,
					type: 'string'
				})
				.positional('email', {
					describe: "User's email address",
					demandOption: true,
					type: 'string'
				});
		},
		async (argv) => {
			const rl = readline.createInterface({
				input: process.stdin,
				output: mutableStdout,
				terminal: true
			});

			const password = await new Promise<string>((resolve) => {
				rl.question('Password? ', function (pw) {
					resolve(pw);
					process.stdout.write('\n');
					rl.close();
				});
				mutableStdout.muted = true;
			});

			createUser(argv, password);
		}
	)
	.parse();
