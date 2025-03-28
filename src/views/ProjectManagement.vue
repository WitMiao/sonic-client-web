<script setup>
import { onBeforeMount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import defaultLogo from '../assets/logo.png';
import axios from '../http/axios';
import ProjectUpdate from './ProjectUpdate.vue';

const dialogVisible = ref(false);
const store = useStore();
const router = useRouter();

const projectData = ref([]);
const theme = ref('');
const getProjectList = () => {
  axios.get('/projects/list').then((resp) => {
    projectData.value = resp.data;
    store.commit('saveProjectList', projectData.value);
  });
};
const flush = () => {
  dialogVisible.value = false;
  getProjectList();
};

const jump = (project) => {
  store.commit('saveProject', project);
  router.push({
    path: `/Home/${project.id}/ProjectIndex`,
  });
};
const toggleClass = (t) => {
  localStorage.setItem('SonicTheme', t);
  store.commit('saveTheme', theme.value);
  document.body.className = `sonic-${t}`;
};
onBeforeMount(() => {
  theme.value = localStorage.getItem('SonicTheme')
    ? localStorage.getItem('SonicTheme')
    : 'light';
});
onMounted(() => {
  toggleClass(theme.value);
  getProjectList();
});

// 国际化设置
const { t: $t } = useI18n();
</script>

<template>
  <div>
    <el-dialog
      v-model="dialogVisible"
      :title="$t('dialog.projectInfo')"
      width="600px"
    >
      <project-update v-if="dialogVisible" :is-update="false" @flush="flush" />
    </el-dialog>
    <el-scrollbar class="demo-tree-scrollbar" style="height: 100%">
      <el-main>
        <el-alert
          :title="$t('layout.welcomeSpeech')"
          type="info"
          center
          :closable="false"
        >
        </el-alert>
        <div style="text-align: center">
          <el-button
            type="primary"
            size="small"
            style="margin-top: 15px"
            @click="dialogVisible = true"
          >
            {{ $t('layout.addProject') }}
          </el-button>
        </div>
        <el-row
          v-if="projectData && projectData.length > 0"
          style="margin-top: 10px"
          justify="center"
          type="flex"
        >
          <el-col
            v-for="project in projectData"
            :key="project"
            :xs="12"
            :sm="8"
            :md="8"
            :lg="4"
            :xl="3"
          >
            <div @click="jump(project)">
              <el-card
                style="margin: 10px 10px; cursor: pointer"
                shadow="hover"
              >
                <div style="text-align: center">
                  <el-avatar
                    :src="
                      project['projectImg'].length > 0
                        ? project['projectImg']
                        : defaultLogo
                    "
                    :size="150"
                    shape="square"
                  ></el-avatar>
                </div>
                <el-form
                  label-position="left"
                  class="demo-table-expand"
                  style="margin-top: 10px"
                >
                  <el-form-item style="text-align: center">
                    <strong style="font-size: 17px">{{
                      project['projectName']
                    }}</strong>
                  </el-form-item>
                  <el-form-item>
                    <p
                      style="
                        text-indent: 2em;
                        line-height: 30px;
                        margin-top: 0px;
                      "
                    >
                      {{
                        project['projectDes'].length > 30
                          ? project['projectDes'].substring(0, 30) + '...'
                          : project['projectDes']
                      }}
                    </p>
                  </el-form-item>
                </el-form>
              </el-card>
            </div>
          </el-col>
        </el-row>
        <el-empty v-else :image-size="200"></el-empty>
      </el-main>
    </el-scrollbar>
  </div>
</template>
