import { LOCALE_KEY } from '@/config/cache';
import { localeSetting } from '@/config/locale';
import { getLocal, setLocal } from '@/utils/cache/localStorage';
import { createStore } from 'vuex';

const debug = process.env.NODE_ENV !== 'production';

export default createStore({
  strict: debug,
  state() {
    return {
      userInfo: {},
      token: localStorage.getItem('SonicToken')
        ? localStorage.getItem('SonicToken')
        : '',
      isCollapse: false,
      project: {},
      projectList: [],
      menuBack: '',
      menuText: '',
      menuActiveText: '',
      currentTheme: 'light',
      localInfo: getLocal(LOCALE_KEY) || localeSetting,
      lastSearchParam: {},
      masterControl: '',
      controlsMachine: [],
    };
  },
  mutations: {
    saveTheme(state, payload) {
      state.currentTheme = payload;
      if (payload === 'light') {
        state.menuBack = '#ffffff';
        state.menuText = '#909399';
        state.menuActiveText = '#409EFF';
      } else {
        state.menuBack = '#545c64';
        state.menuText = '#ffffff';
        state.menuActiveText = '#ffd04b';
      }
    },
    saveProjectList(state, payload) {
      state.projectList = payload;
    },
    setControlsMachine(state, payload) {
      if (!payload.type) {
        state.controlsMachine = [];
        return;
      }
      if (payload.val) {
        state.controlsMachine.push(payload.id);
      } else {
        state.controlsMachine = state.controlsMachine.filter(
          (item) => item !== payload.id
        );
      }
    },
    saveProject(state, payload) {
      state.project = payload;
    },
    changeCollapse(state) {
      state.isCollapse = !state.isCollapse;
    },
    autoChangeCollapse(state) {
      if (state.isCollapse === false) {
        state.isCollapse = !state.isCollapse;
      }
    },
    changeLogin(state, sonicToken) {
      state.token = sonicToken;
      localStorage.setItem('SonicToken', sonicToken);
    },
    setUserInfo(state, userInfo) {
      state.userInfo = userInfo;
    },
    clearAuth(state) {
      state.token = '';
      state.userInfo = {};
      localStorage.removeItem('SonicToken');
    },
    setLocaleInfo(state, info) {
      state.localInfo = info;
    },
    setLastSearchParam(state, info) {
      state.lastSearchParam = info;
    },
    setMasterControl(state, payload) {
      state.masterControl = payload;
    },
  },
  getters: {
    getLocale(state) {
      return state.localInfo?.locale ?? 'zh_CN';
    },
    getLastSearchParam(state) {
      return state?.lastSearchParam ?? {};
    },
    getMasterControl(state) {
      return state?.masterControl ?? '';
    },
    getControlsMachine(state) {
      return state?.controlsMachine ?? [];
    },
  },
  actions: {
    // 设置国际化相关信息
    changeLocaleInfo({ commit, state }, info) {
      const localInfo = { ...state.localInfo, ...info };
      commit('setLocaleInfo', localInfo);
      setLocal(LOCALE_KEY, localInfo);
    },
  },
});
