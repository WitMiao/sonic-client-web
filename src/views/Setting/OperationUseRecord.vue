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
        <el-table-column prop="udid" fixed label="设备ID" width="220" />
        <el-table-column prop="deviceName" fixed label="设备名称" width="220" />
        <el-table-column prop="platform" label="平台" width="90" />
        <el-table-column prop="userName" label="用户名" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column prop="useTime" label="使用时长(分钟)" width="180" />
        <el-table-column prop="startCpu" label="开始时CPU使用率(%)" width="160">
          <template #default="{ row }">
            {{ Math.floor(row.startCpu * 10) / 10 }}
          </template>
        </el-table-column>
        <el-table-column prop="endCpu" label="结束时CPU使用率(%)" width="160">
          <template #default="{ row }">
            {{ Math.floor(row.endCpu * 10) / 10 }}
          </template>
        </el-table-column>
        <el-table-column label="CPU使用率" width="200">
          <template #default="{ row }">
            <div style="display: flex">
              <span style="margin-right: 6px">开始</span>
              <el-progress :percentage="row.startCpu" style="flex: 1" />
            </div>
            <div style="display: flex">
              <span style="margin-right: 6px">结束</span>
              <el-progress :percentage="row.endCpu || 0" style="flex: 1" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="startMem" label="开始时内存(GB)" width="130">
          <template #default="{ row }">
            {{ Math.floor(row.startMem * 10) / 10 }}
          </template>
        </el-table-column>

        <el-table-column prop="endMem" label="结束时内存(GB)" width="130">
          <template #default="{ row }">
            {{ Math.floor(row.endMem * 10) / 10 }}
          </template>
        </el-table-column>
        <el-table-column label="内存使用率" width="200">
          <template #default="{ row }">
            <div style="display: flex">
              <span style="margin-right: 6px">开始</span>
              <el-progress
                :percentage="
                  (100 * row.startMem) /
                  Math.ceil(Math.max(row.startMem, row.endMem))
                "
                style="flex: 1"
              >
                <div text>{{ Math.floor(row.startMem * 10) / 10 }}</div>
              </el-progress>
            </div>
            <div style="display: flex">
              <span style="margin-right: 6px">结束</span>
              <el-progress
                :percentage="
                  (100 * row.endMem || 0) /
                  Math.ceil(Math.max(row.startMem, row.endMem))
                "
                style="flex: 1"
                ><div text>{{ Math.floor(row.endMem * 10) / 10 }}</div>
              </el-progress>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="startBattery" label="开始时电量" width="100" />
        <el-table-column prop="endBattery" label="结束时电量" width="100" />
        <el-table-column label="电量" width="200">
          <template #default="{ row }">
            <div style="display: flex">
              <span style="margin-right: 6px">开始</span>
              <el-progress :percentage="row.startBattery" style="flex: 1" />
            </div>
            <div style="display: flex">
              <span style="margin-right: 6px">结束</span>
              <el-progress :percentage="row.endBattery || 0" style="flex: 1" />
            </div>
          </template>
        </el-table-column>
        <el-table-column width="90" fixed="right">
          <template #default="{ row }">
            <div style="cursor: pointer" @click="click(row)">查看详情</div>
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
import { useStore } from 'vuex';

const formInline = reactive({
  udid: '',
  userName: '',
  time: '',
});
const router = useRouter();
const store = useStore();
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
  formInline.udid = store.state.lastSearchParam.udid ?? '';
  formInline.userName = store.state.lastSearchParam.userName ?? '';
  formInline.time = store.state.lastSearchParam.time ?? '';
  currentPage.value = store.state.lastSearchParam.currentPage ?? 1;
  pageSize.value = store.state.lastSearchParam.pageSize ?? 10;
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
const click = (row) => {
  // 跳转
  if (!row.recordNum) {
    return;
  }
  // 保存设备ID,用户名，时间
  store.commit('setLastSearchParam', {
    ...formInline,
    currentPage: currentPage.value,
    pageSize: pageSize.value,
  });

  router.push({
    name: 'OperationActionRecord',
    query: {
      recordNum: row.recordNum,
      platform: row.platform,
      udid: row.udid,
      deviceName: row.deviceName,
    },
  });
};
</script>

<style></style>
