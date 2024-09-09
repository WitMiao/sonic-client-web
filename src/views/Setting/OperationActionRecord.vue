<template>
  <div>
    <el-form :inline="true" :model="formInline" class="demo-form-inline">
      <el-form-item label="设备ID">
        <el-input
          v-model="formInline.udid"
          placeholder="输入设备ID"
          clearable
        />
      </el-form-item>
      <el-form-item label="用户名">
        <el-input
          v-model="formInline.userName"
          placeholder="输入用户名"
          clearable
        />
      </el-form-item>
      <el-form-item label="触发时间">
        <el-date-picker
          v-model="formInline.createTime"
          type="datetime"
          placeholder="输入触发时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="x"
          clearable
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">搜索</el-button>
      </el-form-item>
    </el-form>
    <div>
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column prop="udid" label="设备ID" width="220" />
        <el-table-column prop="platform" label="平台" width="120" />
        <el-table-column prop="userName" label="用户名" width="120" />
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
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const tableData = ref([[]]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const formInline = ref({
  udid: '',
  userName: '',
  createTime: '',
});

const actionMap = {
  install: '安装',
  uninstall: '卸载',
  lock: '锁定屏幕',
  unlock: '解锁屏幕',
  run: '启动应用',
  exit: '退出应用',
};
const getActionRecord = async ({ udid, userName, createTime }) => {
  const { data, code } = await axios.get(
    `/controller/actionRecord/list?page=${currentPage.value}&pageSize=${
      pageSize.value
    }&recordNum=${route.query.recordNum}${udid ? `&udid=${udid}` : ''}${
      userName ? `&userName=${userName}` : ''
    }${createTime ? `&startTime=${createTime}` : ''}`
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
</script>

<style></style>
