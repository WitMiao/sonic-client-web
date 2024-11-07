<script setup>
/*
 *   sonic-client-web  Front end of Sonic cloud real machine platform.
 *   Copyright (C) 2022 SonicCloudOrg
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Affero General Public License as published
 *   by the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Affero General Public License for more details.
 *
 *   You should have received a copy of the GNU Affero General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import axios from '@/http/axios';
import { QuestionFilled } from '@element-plus/icons';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();
const props = defineProps({
  ticker: Number,
  idleCount: Number,
  remoteTimeout: Number,
  idleTimeout: Number,
  isShowRenewButton: Boolean,
});
const emit = defineEmits(['close', 'addTime']);
const useTimeDialogVisible = ref(false);
const useAddTime = ref(0);
const useAddTimeMax = ref(0);
const parseTimeout = (time) => {
  let h = parseInt((time / 60 / 60) % 24);
  h = h < 10 ? `0${h}` : h;
  let m = parseInt((time / 60) % 60);
  m = m < 10 ? `0${m}` : m;
  let s = parseInt(time % 60);
  s = s < 10 ? `0${s}` : s;
  return `${h} ${$t('common.hour')} ${m} ${$t('common.min')} ${s} ${$t(
    'common.sec'
  )} `;
};
const close = () => {
  emit('close');
};
// 续期
const openTimeDialogVisible = async () => {
  // 获取系统时间
  const resp = await axios.get('/controller/confList/getRemoteTimeout');
  useAddTimeMax.value = resp.data;
  useAddTime.value = resp.data;
  useTimeDialogVisible.value = true;
};
const addTime = () => {
  emit('addTime', useAddTime.value);
  useTimeDialogVisible.value = false;
};
</script>

<template>
  <div class="remote-header">
    <el-page-header @back="close">
      <template #content>
        <div style="display: flex; align-items: center">
          {{ $t('routes.remoteControl') + ' - ' }}
          <span style="font-size: 12px; margin-left: 10px">
            <div>{{ $t('common.inuse') }} {{ parseTimeout(ticker) }}</div>
            <div>{{ $t('common.inidle') }} {{ parseTimeout(idleCount) }}</div>
          </span>
          <el-popover placement="bottom" width="270" trigger="hover">
            <div>
              {{
                $t('settingIndexTS.remote.text') +
                remoteTimeout +
                ' ' +
                $t('common.min')
              }}
            </div>
            <div>
              {{
                $t('settingIndexTS.remote.idle_text') +
                idleTimeout +
                ' ' +
                $t('common.min')
              }}
            </div>
            <div>{{ $t('common.release') }}</div>
            <template #reference>
              <div style="margin-left: 10px; color: #909399">
                <el-icon :size="15" style="vertical-align: middle">
                  <QuestionFilled />
                </el-icon>
              </div>
            </template>
          </el-popover>
          <el-button
            v-if="isShowRenewButton"
            type="primary"
            style="margin-left: 10px"
            @click="openTimeDialogVisible"
            >续期</el-button
          >
        </div>
      </template>
    </el-page-header>
    <el-dialog v-model="useTimeDialogVisible" title="使用时长" :width="400">
      <el-form label-width="auto" style="max-width: 600px">
        <el-form-item label="使用时长">
          <el-input-number
            v-model="useAddTime"
            :min="0"
            :max="useAddTimeMax"
          /><span style="margin-left: 10px">分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="text-align: center">
          <el-button size="small" @click="useTimeDialogVisible = false"
            >取消</el-button
          >
          <el-button size="small" type="primary" @click="addTime">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
