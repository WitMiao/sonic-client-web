<template>
  <div>
    <el-form :inline="true" :model="formInline" class="demo-form-inline">
      <!-- <el-form-item label="设备ID">
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
      </el-form-item> -->

      <el-form-item label="时间范围">
        <el-date-picker
          v-model="formInline.time"
          type="datetimerange"
          placeholder="输入开始时间"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="x"
          clearable
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="onSubmit">搜索</el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>
    <div>
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column prop="udid" label="设备ID" width="220" />
        <el-table-column prop="platform" label="平台" width="90" />
        <el-table-column prop="userName" label="用户名" width="120" />
        <el-table-column prop="startTime" label="开始时间" />
        <el-table-column prop="startCpu" label="开始时CPU使用率(%)">
          <template #default="{ row }">
            {{ Math.floor(row.startCpu * 10) / 10 }}
          </template>
        </el-table-column>
        <el-table-column prop="startMem" label="开始时内存(GB)">
          <template #default="{ row }">
            {{ Math.floor(row.startMem * 10) / 10 }}
          </template>
        </el-table-column>
        <el-table-column prop="startBattery" label="开始时电量" />
        <el-table-column prop="endTime" label="结束时间" />
        <el-table-column prop="endCpu" label="结束时CPU使用率(%)">
          <template #default="{ row }">
            {{ Math.floor(row.endCpu * 10) / 10 }}
          </template>
        </el-table-column>
        <el-table-column prop="endMem" label="结束时内存(GB)">
          <template #default="{ row }">
            {{ Math.floor(row.endMem * 10) / 10 }}
          </template>
        </el-table-column>
        <el-table-column prop="endBattery" label="结束时电量" />
        <el-table-column width="90">
          <template #default="{ row }">
            <div style="cursor: pointer" @click="click(row.recordNum)">
              查看详情
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div style="text-align: center; margin-top: 5px">
        <el-pagination
          v-model:current-page="currentPage"
          small
          :total="total"
          :page-size="pageSize"
          @current-change="getUseRecord(formInline)"
        >
        </el-pagination>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from '@/http/axios';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

const formInline = reactive({
  udid: '',
  userName: '',
  time: '',
});
const router = useRouter();
const tableData = ref([[]]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const getUseRecord = async ({ udid, userName, time }) => {
  const { data, code } = await axios.get(
    `/controller/useRecord/list?page=${currentPage.value}&pageSize=${
      pageSize.value
    }${udid ? `&udid=${udid}` : ''}${userName ? `&userName=${userName}` : ''}${
      time ? `&startTime=${time[0]}` : ''
    }${time ? `&endTime=${time[1]}` : ''}`
  );

  if (code === 2000) {
    total.value = data.totalElements;
    tableData.value = data.content;
  }
};
onMounted(async () => {
  getUseRecord(formInline);
});
const onSubmit = () => {
  currentPage.value = 1;
  pageSize.value = 10;
  getUseRecord(formInline);
};
const onReset = () => {
  currentPage.value = 1;
  pageSize.value = 10;
  formInline.udid = '';
  formInline.userName = '';
  formInline.time = '';

  getUseRecord(formInline);
};
const click = (recordNum) => {
  // 跳转
  if (!recordNum) {
    return;
  }
  router.push({ name: 'OperationActionRecord', query: { recordNum } });
};
</script>

<style></style>
