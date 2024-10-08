<template>
  <div>
    <div style="display: flex; align-items: center; gap: 20px">
      <el-icon
        style="margin-bottom: 22px; font-weight: 700; cursor: pointer"
        :size="20"
        @click="router.push({ name: 'OperationUseRecord' })"
        ><Back
      /></el-icon>

      <el-form :inline="true" :model="formInline" class="demo-form-inline">
        <el-form-item label="触发操作">
          <el-select v-model="formInline.action" placeholder="请选择触发操作"  clearable @change="onSubmit">
            <el-option
              v-for="item in actionMapOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="触发时间范围">
          <el-date-picker
            v-model="formInline.time"
            type="datetimerange"
            placeholder="输入开始时间"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="x"
            clearable
            @change="onSubmit"
          />
        </el-form-item>
    
        <el-form-item>
          <el-button type="primary" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div style="display: flex; margin-bottom: 10px">
      <div style="display: flex; align-items: center; margin-right: 10px">
        <div style="font-weight: 700">设备ID：</div>
        <div>{{ route.query.udid }}</div>
      </div>
      <div style="display: flex; align-items: center; margin-right: 10px">
        <div style="font-weight: 700">设备名称：</div>
        <div>{{ route.query.deviceName }}</div>
      </div>
      <div style="display: flex; align-items: center; margin-right: 10px">
        <div style="font-weight: 700">平台：</div>
        <div>{{ route.query.platform }}</div>
      </div>
    </div>
    <div>
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column prop="packName" label="包名" />
        <el-table-column prop="action" label="触发动作">
          <template #default="{ row }">
            {{ actionMap[row.action] }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="触发时间" />
      </el-table>
      <div style="text-align: center; margin-top: 5px">
        <el-pagination
          v-model:current-page="currentPage"
          small
          :total="total"
          :page-size="pageSize"
          @current-change="getActionRecord(formInline)"
        >
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from '@/http/axios';
import { Back } from '@element-plus/icons';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const tableData = ref([[]]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const formInline = ref({
  udid: '',
  userName: '',
  time: '',
  action: '',
});

const actionMap = {
  install: '安装',
  uninstall: '卸载',
  lock: '锁定屏幕',
  unlock: '解锁屏幕',
  start: '启动应用',
  exit: '退出应用',
};

const actionMapOption = Object.keys(actionMap).map((key) => ({
  value: key,
  label: actionMap[key],
}));

const getActionRecord = async ({ udid, userName, time, action }) => {
  const { data, code } = await axios.get(
    `/controller/actionRecord/list?page=${currentPage.value}&pageSize=${
      pageSize.value
    }&recordNum=${route.query.recordNum}${udid ? `&udid=${udid}` : ''}${
      userName ? `&userName=${userName}` : ''
    }${time ? `&startTime=${time[0]}` : ''}${
      time ? `&endTime=${time[1]}` : ''
    }${action ? `&action=${action}` : ''}`
  );

  if (code === 2000) {
    total.value = data.totalElements;
    tableData.value = data.content;
  }
};
onMounted(async () => {
  getActionRecord(formInline.value);
});
const onSubmit = () => {
  currentPage.value = 1;
  pageSize.value = 10;
  getActionRecord(formInline.value);
};
const onReset = () => {
  formInline.value = {
    udid: '',
    userName: '',
    time: '',
    action: '',
  };
  currentPage.value = 1;
  pageSize.value = 10;
  getActionRecord(formInline.value);
};
</script>

<style></style>
