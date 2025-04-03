<script setup>
import { Cellphone, Expand, Fold, Tickets } from '@element-plus/icons';
import { ElMessage } from 'element-plus';
import { onBeforeMount, onMounted, ref, watch } from 'vue';
import useClipboard from 'vue-clipboard3';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from '../http/axios';
import ProjectUpdate from '../views/ProjectOption.vue';

// 国际化设置
const { t: $t } = useI18n();
const { toClipboard } = useClipboard();

const changePwdForm = ref(null);
const changePwd = ref({
  oldPwd: '',
  newPwd: '',
  newPwdSec: '',
});
const dialogUserInfo = ref(false);
const dialogVisible = ref(false);
const dialogToken = ref(false);
const day = ref(14);
const store = useStore();
const router = useRouter();
const route = useRoute();
const projectData = ref([]);
const theme = ref('');

const copy = (value) => {
  try {
    toClipboard(value);
    ElMessage.success({
      message: $t('dialog.copy.success'),
    });
  } catch (e) {
    ElMessage.error({
      message: $t('dialog.copy.fail'),
    });
  }
};
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error($t('form.notEmpty')));
  } else {
    if (changePwd.value.newPwd !== changePwd.value.newPwdSec) {
      callback(new Error($t('form.differentInput')));
    }
    callback();
  }
};
const dialogChangePwd = ref(false);
const tokenNew = ref('');
watch(dialogChangePwd, (newValue, oldValue) => {
  if (!newValue) {
    changePwd.value = {
      oldPwd: '',
      newPwd: '',
      newPwdSec: '',
    };
  }
});
const generateToken = () => {
  axios
    .get('/users/generateToken', {
      params: { day: day.value },
    })
    .then((resp) => {
      if (resp.code === 2000) {
        ElMessage.success({
          message: resp.message,
        });
        tokenNew.value = resp.data;
      }
    });
};
const changePwdSummit = () => {
  changePwdForm.value.validate((valid) => {
    if (valid) {
      axios
        .put('/users', {
          oldPwd: changePwd.value.oldPwd,
          newPwd: changePwd.value.newPwd,
        })
        .then((resp) => {
          if (resp.code === 2000) {
            ElMessage.success({
              message: resp.message,
            });
            dialogChangePwd.value = false;
          }
        });
    }
  });
};

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
const pushIndex = (path) => {
  router.push({
    path,
  });
};
const logout = () => {
  store.commit('clearAuth');
  const ssoLogoutUrl = `https://info-sso.hypergryph.net/api/logout?redirectUrl=${encodeURIComponent(
    `${location.origin}/Login?isLogout=1`
  )}`;
  window.open(ssoLogoutUrl, '_self');
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
</script>

<template>
  <el-container direction="vertical">
    <el-header>
      <div class="flex-center demo">
        <div
          v-if="
            route.params.projectId || route.fullPath.indexOf('/Setting') != -1
          "
          style="margin: 0 20px; cursor: pointer"
          @click="store.commit('changeCollapse')"
        >
          <el-icon
            v-if="store.state.isCollapse === false"
            :size="20"
            style="vertical-align: middle"
          >
            <Fold />
          </el-icon>
          <el-icon v-else :size="20" style="vertical-align: middle">
            <Expand />
          </el-icon>
        </div>
        <el-tooltip
          :content="$t('layout.theme') + theme.toUpperCase()"
          placement="bottom"
        >
          <el-switch
            v-model="theme"
            style="margin-left: 15px"
            :width="33"
            active-value="light"
            inactive-value="dark"
            active-color="#C0C4CC"
            inactive-color="#ffffff"
            active-icon-class="el-icon-sunny"
            inactive-icon-class="el-icon-moon"
            @change="toggleClass"
          ></el-switch>
        </el-tooltip>
        <!-- <el-menu
          :ellipsis="false"
          :background-color="store.state.menuBack"
          :text-color="store.state.menuText"
          :active-text-color="store.state.menuActiveText"
          mode="horizontal"
          class="el-menu-horizontal-demo font"
        >
          <el-sub-menu index="Language">
            <template #title>{{ $t('layout.languages') }}</template>
            <el-menu-item
              v-for="item in localeList"
              :key="item.event"
              :index="item.event"
              @click="changeLocaleHandler"
              >{{ item.text }}
              <el-badge
                v-if="item.building"
                type="primary"
                value="building"
                style="margin: 0 0 5px 5px"
              ></el-badge>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>-->
      </div>
      <div class="flex-center">
        <el-menu
          :ellipsis="false"
          :background-color="store.state.menuBack"
          :text-color="store.state.menuText"
          :active-text-color="store.state.menuActiveText"
          mode="horizontal"
          class="el-menu-horizontal-demo font"
          :default-active="route.path"
        >
          <el-menu-item
            v-if="
              route.params.projectId ||
              route.fullPath === '/Index/ProjectManagement' ||
              route.fullPath.indexOf('/Setting') != -1
            "
            index="/Index/Devices"
            @click="pushIndex('/Index/Devices')"
          >
            <el-icon
              :size="18"
              style="vertical-align: middle; margin-right: 5px"
            >
              <Cellphone />
            </el-icon>
            {{ $t('layout.deviceCenter') }}
          </el-menu-item>
          <el-menu-item
            v-if="
              route.params.projectId ||
              route.fullPath === '/Index/Devices' ||
              route.fullPath.indexOf('/Setting') != -1
            "
            index="/Index/ProjectManagement"
            @click="pushIndex('/Index/ProjectManagement')"
          >
            <el-icon
              :size="18"
              style="vertical-align: middle; margin-right: 5px"
            >
              <Tickets />
            </el-icon>
            项目管理
          </el-menu-item>
          <el-sub-menu index="1">
            <template #title>
              <el-avatar
                size="medium"
                style="background: #409eff !important; margin-right: 5px"
              >
                {{
                  store.state.userInfo.userName &&
                  store.state.userInfo.userName.length > 1
                    ? store.state.userInfo.userName.substring(
                        store.state.userInfo.userName.length - 2
                      )
                    : store.state.userInfo.userName
                }}
              </el-avatar>
              {{ store.state.userInfo.userName }}
            </template>
            <el-menu-item index="1-0" @click="pushIndex('/Setting')">
              {{ $t('setting.title') }}
            </el-menu-item>
            <el-menu-item index="1-1" @click="dialogUserInfo = true">{{
              $t('layout.myInfo')
            }}</el-menu-item>
            <el-menu-item index="1-2" @click="dialogChangePwd = true">{{
              $t('layout.changePassword')
            }}</el-menu-item>
            <el-menu-item index="1-4" @click="dialogToken = true"
              >Access Token</el-menu-item
            >
            <!-- <el-sub-menu index="2">
              <template #title
                ><span class="flex-center font title"
                  ><img style="margin-right: 5px" width="20" :src="logo" />{{
                    $t('layout.aboutSonic')
                  }}</span
                >
              </template>
              <el-menu-item
                index="2-1"
                @click="goToUrl('https://sonic-cloud.cn/home')"
                >{{ $t('layout.officialWebSite') }}
              </el-menu-item>
              <el-menu-item
                index="2-0"
                @click="goToUrl('https://sonic-cloud.cn/document')"
                >{{ $t('layout.document') }}
              </el-menu-item>
              <el-menu-item
                index="2-2"
                @click="goToUrl('https://sonic-cloud.cn/version')"
                >{{ $t('layout.versionUpdateRecord') }}
                <el-badge value="New" style="margin: 0 0 5px 5px"></el-badge>
              </el-menu-item>
              <el-menu-item
                index="2-3"
                @click="
                  goToUrl(
                    axios.defaults.baseURL.substring(
                      0,
                      axios.defaults.baseURL.length - 4
                    ) + '/doc.html'
                  )
                "
              >
                REST API
              </el-menu-item>
            </el-sub-menu> -->
            <el-menu-item index="1-3" @click="logout">{{
              $t('layout.signOut')
            }}</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
    </el-header>
    <el-backtop
      :right="20"
      :bottom="20"
      target=".demo-tree-scrollbar .el-scrollbar__wrap"
    ></el-backtop>
    <el-dialog
      v-model="dialogVisible"
      :title="$t('dialog.projectInfo')"
      width="600px"
    >
      <project-update v-if="dialogVisible" :is-update="false" @flush="flush" />
    </el-dialog>
    <el-dialog
      v-model="dialogUserInfo"
      :title="$t('dialog.myInfo')"
      width="420px"
      center
    >
      <el-form
        label-position="left"
        class="demo-table-expand"
        label-width="90px"
        style="margin-left: 10px; word-break: break-all"
      >
        <el-form-item :label="$t('form.username')">
          <span>{{ store.state.userInfo.userName }}</span>
        </el-form-item>
        <el-form-item :label="$t('form.role')">
          <el-tag size="small">
            {{
              store.state.userInfo.roleName
                ? store.state.userInfo.roleName
                : '无'
            }}
          </el-tag>
        </el-form-item>
      </el-form>
    </el-dialog>
    <el-dialog
      v-model="dialogChangePwd"
      :title="$t('dialog.changePassword')"
      width="520px"
    >
      <el-form
        v-if="dialogChangePwd"
        ref="changePwdForm"
        label-position="left"
        class="demo-table-expand"
        label-width="70px"
        size="small"
        :model="changePwd"
      >
        <el-form-item
          :rules="{
            required: true,
            message: $t('form.oldPasswordNotEmpty'),
            trigger: 'blur',
          }"
          prop="oldPwd"
          :label="$t('form.oldPassword')"
        >
          <el-input
            v-model="changePwd.oldPwd"
            prefix-icon="el-icon-lock"
            type="password"
            show-password
            :placeholder="$t('form.inputOldPassword')"
          ></el-input>
        </el-form-item>
        <el-form-item
          :rules="{
            required: true,
            message: $t('form.newPasswordNotEmpty'),
            trigger: 'blur',
          }"
          prop="newPwd"
          :label="$t('form.newPassword')"
        >
          <el-input
            v-model="changePwd.newPwd"
            prefix-icon="el-icon-lock"
            type="password"
            show-password
            :placeholder="$t('form.inputNewPassword')"
          ></el-input>
        </el-form-item>
        <el-form-item
          prop="newPwdSec"
          :rules="{
            validator: validatePass,
            trigger: 'blur',
          }"
        >
          <el-input
            v-model="changePwd.newPwdSec"
            prefix-icon="el-icon-lock"
            type="password"
            show-password
            :placeholder="$t('form.inputNewPasswordAgain')"
          ></el-input>
        </el-form-item>
      </el-form>
      <div style="text-align: center">
        <el-button size="small" type="primary" @click="changePwdSummit">{{
          $t('form.confirm')
        }}</el-button>
      </div>
    </el-dialog>
    <el-dialog v-model="dialogToken" title="AccessToken" width="520px">
      <el-form
        v-if="dialogToken"
        label-position="left"
        class="demo-table-expand"
        label-width="90px"
        size="small"
      >
        <el-form-item :label="$t('token.day')">
          <el-input-number
            v-model="day"
            size="small"
            :min="1"
            :max="999"
          ></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('token.result')">
          <div
            v-if="tokenNew !== ''"
            style="cursor: pointer"
            @click="copy(tokenNew)"
          >
            {{ tokenNew.substring(0, 15) + '*******' + $t('token.click') }}
          </div>
          <div v-else>{{ $t('token.copy') }}</div>
        </el-form-item>
      </el-form>
      <div style="text-align: center">
        <el-button size="small" type="primary" @click="generateToken">{{
          $t('form.confirm')
        }}</el-button>
      </div>
    </el-dialog>
    <el-scrollbar class="demo-tree-scrollbar" style="height: 100%">
      <el-main
        v-if="
          route.params.projectId ||
          route.params.deviceId ||
          route.fullPath === '/Index/Devices' ||
          route.fullPath === '/Index/ProjectManagement' ||
          route.fullPath.indexOf('/Setting') != -1
        "
      >
        <router-view />
      </el-main>
    </el-scrollbar>
  </el-container>
</template>
