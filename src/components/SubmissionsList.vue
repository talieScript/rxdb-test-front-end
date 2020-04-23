<template>
  <v-list class="pa-1">
    <v-subheader>Submissions</v-subheader>
    <v-list-item-group v-model="item" color="primary">
      <v-list-item
        class="d-flex justify-space-between"
        v-for="submission in submissions"
        :key="submission.id"
      >
        <v-list-item-content @click="changeSubmssion(submission.id)">
          <span>{{ submission.id }}</span>
        </v-list-item-content>
        <v-btn
          @click="$emit('deleteSubmission', submission)"
          color="error"
          fab
          x-small
          icon
          dark
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-list-item>
    </v-list-item-group>
    <v-list-item class="d-flex justify-center">
      <v-btn @click="$emit('addSubmission')" color="success" fab small dark>
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "SubmissionsList",
  props: {
    submissions: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      item: 1
    };
  },
  computed: {
    jsonSubmissions() {
      return this.submissions.map((submission: any) => {
        return submission.toJSON();
      });
    }
  },
  methods: {
    changeSubmssion(id: number) {
      this.$emit("changeSubmission", id);
    }
  }
});
</script>

<style scoped></style>
