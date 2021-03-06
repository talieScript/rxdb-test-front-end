<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">
        <v-btn @click="menu = !menu" text>
          <v-icon>mdi-menu</v-icon>
          <span class="ml-2">Submissions</span>
        </v-btn>
      </div>

      <v-spacer></v-spacer>

      <v-img
        alt="Stratum Logo"
        class="shrink mr-2"
        contain
        src="https://res-2.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_256,w_256,f_auto,q_auto:eco/41873246e73b8cf3ed5f"
        transition="scale-transition"
        width="150"
      />
    </v-app-bar>

    <v-navigation-drawer v-model="menu" absolute temporary>
      <SubmissionsList
        @changeSubmission="changeActiveSubmission"
        @addSubmission="addSubmission"
        @deleteSubmission="deleteSubmission"
        :submissions="submissions"
        :db="db"
      />
    </v-navigation-drawer>

    <v-dialog :value="dialog && !preventDialog" width="500" persistent>
      <v-card>
        <v-card-title class="headline grey lighten-2" primary-title>
          Update
        </v-card-title>

        <v-card-text class="mt-2">
          {{ dialogText }}
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="updateActiveSubmission">
            Ok, Thanks for informing me.
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-content>
      <submssion-form
        v-if="activeSubmission.id"
        @submit="submit"
        :active="activeSubmission"
      />
      <p v-else class="text-center text--secondary">
        Select or create a submission.
      </p>
      <v-list>
        <v-subheader>Changes</v-subheader>
        <v-list-item
          v-for="(change, index) in changes[this.activeSubmission.id]"
          :key="index"
        >
          <v-icon>mdi-clock</v-icon>
          <v-chip
            class="ma-2"
            v-for="(changeItem, index) in change"
            :key="index"
          >
            {{ index }} was {{ changeItem }}
          </v-chip>
        </v-list-item>
      </v-list>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import SubmissionsList from "./components/SubmissionsList.vue";
import SubmssionForm from "./components/SubmissionForm.vue";
import { getDb } from "./services/Database.service.js";
// import { submissionSchema } from "./submission.schema.ts";
import emptySubmssion from "./dummyData/emptySubmission.js";
import { v4 as uuid } from "uuid";
import diff from "object-diff";

export interface Submission {
  id: string;
  vesselName: string;
  vesselImo: number;
  dateOffset: {
    // iso string
    date: string;
    // + or - offset
    offset: number;
  };
  fuels: {
    LGO: number;
    IFO: number;
    MGO: number;
  };
  // sum of fuels
  totalFuel: number;
}

export default Vue.extend({
  name: "App",
  components: {
    SubmissionsList,
    SubmssionForm
  },
  data() {
    return {
      menu: true,
      submissions: [] as any[],
      activeSubmission: {} as any,
      db: {} as any,
      updateWarning: true,
      state: {} as any,
      dialog: false,
      deletedDialog: false,
      preventDialog: false,
      dialogText: "",
      changes: {}
    };
  },
  computed: {
    activeSubmissionDocument() {
      const activeDocument = (this as any).submissions.find(
        submission => submission.id === this.activeSubmission.id
      );
      console.log(activeDocument);
      return activeDocument.$.subscribe(change => console.log(change));
    }
  },

  watch: {
    activeSubmission(val, oldVal) {
      const activeDocument = this.submissions.find(
        submission => submission.id === this.activeSubmission.id
      );
      activeDocument.$.subscribe(change => {
        const { id, vesselImo, vesselName, totalFuel } = this.activeSubmission;
        const diffs = diff(
          { id, vesselImo, vesselName, totalFuel },
          {
            id: change.id,
            vesselImo: change.vesselImo,
            vesselName: change.vesselName,
            totalFuel: change.totalFuel
          }
        );
        const dateDiff = diff(
          this.activeSubmission.dateOffset,
          change.dateOffset
        );
        const fuelDiff = diff(this.activeSubmission.fuels, change.fuels);
        const allDiffs = { ...diffs, ...dateDiff, ...fuelDiff };
        console.log(Object.keys(allDiffs).length);
        if (Object.keys(allDiffs).length) {
          console.log(change.id);
          this.changes[change.id] = this.changes[change.id]
            ? [...this.changes[change.id], allDiffs]
            : [allDiffs];
          this.activeSubmission = change;
        } else {
          console.log("no change");
        }
      });
    }
  },
  methods: {
    async deleteSubmission(submission: any) {
      if (submission.id === this.activeSubmission.id) {
        this.preventDialog = true;
        if (this.submissions.length > 1) {
          this.activeSubmission = this.submissions[0].toJSON();
        } else {
          this.activeSubmission = {};
        }
      }
      submission.remove();
    },
    async addSubmission() {
      const newSubmission = await this.db.submission.insert({
        ...emptySubmssion,
        id: uuid().toString()
      });
      this.activeSubmission = newSubmission;
    },
    async updateActiveSubmission() {
      const submission = this.submissions.find(submission => {
        return submission.id == this.activeSubmission.id;
      });
      if (this.activeSubmission.id && submission) {
        this.activeSubmission = submission.toJSON();
      } else {
        this.activeSubmission = this.submissions[0]
          ? this.submissions[0].toJSON()
          : {};
      }
      this.dialog = false;
    },
    setActiveSubmission(value: any) {
      this.activeSubmission = value;
    },
    changeActiveSubmission(id: string) {
      const submission = this.submissions.find(submission => {
        return submission.id == id;
      }) as any;
      this.activeSubmission = submission.toJSON();
    },
    /**
     * submit function here
     */
    async submit(submission: any) {
      this.preventDialog = true;
      await this.db.submission.upsert({
        id: submission.id,
        vesselName: submission.vesselName,
        vesselImo: submission.vesselImo,
        dateOffset: submission.dateOffset,
        fuels: submission.fuels,
        totalFuel: submission.totalFuel
      });
      this.dialog = false;
    }
  },
  async mounted() {
    getDb().then(async (db: any) => {
      this.db = db;
      this.state = db.submission.sync({
        remote: "https://rxdb-test-backend.herokuapp.com/db/submissions"
      });
      this.state.docs$.subscribe((docData: any) => console.dir("docData"));

      this.submissions = await db.submission.find().exec();
      if (this.submissions.length) {
        this.activeSubmission = this.submissions[0].toJSON();
      }
      db.submission.update$.subscribe(async (event: any) => {
        const updatedId = event.data.doc;
        const index = this.submissions.findIndex(submission => {
          return submission.id == updatedId;
        });
        const submission = await db.submission
          .findOne()
          .where("id")
          .eq(updatedId)
          .exec();
        this.submissions.splice(index, 1, submission);
        if (
          updatedId === this.activeSubmission.id &&
          !(this as any).preventDialog
        ) {
          console.log("here");
          this.dialogText = "This submission has been updated by another user";
          this.dialog = true;
        }
        (this as any).preventDialog = false;
      });
      db.submission.$.subscribe(async (event: any) => {
        this.submissions = await db.submission.find().exec();
        // Handle active submission removed
        if (
          event.data.op === "REMOVE" &&
          event.data.doc === this.activeSubmission.id
        ) {
          this.dialogText = "This submission has been deleted by another user";
          this.dialog = true;
        }
      });
    });
  }
});
</script>
