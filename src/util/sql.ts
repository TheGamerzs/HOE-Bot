import { Connection } from 'mysql';

export async function dbQuery(db: Connection, query: string, values: any): Promise<any> {
	return new Promise((resolve, reject) => {
		try {
			db.query(query, values, (err, result) => {
				if (err) reject(err);
				resolve(result);
			});
		} catch (err) {
			reject(err);
		}
	});
}
