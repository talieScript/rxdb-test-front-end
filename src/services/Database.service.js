import RxDB from "rxdb";
import * as PouchHttpPlugin from "pouchdb-adapter-http";
import PouchDbAdapterIdb from "pouchdb-adapter-idb";
import { submissionSchema } from '../submission.schema.js'
import dummyData from '../dummyData/submissions.ts'
RxDB.plugin(PouchDbAdapterIdb);
RxDB.plugin(PouchHttpPlugin);

export async function getDb() {
  const db = await RxDB.create({
    name: 'submissions',
    adapter: 'idb'
  });

  await db.collection({
      name: 'submission',
      schema: submissionSchema
  });

  const state = db.submission.sync({
    remote: "http://localhost:3000/db/submissions"
  });

  state.docs$.subscribe(docData => console.dir(docData));

  return db;
}
