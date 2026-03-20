import * as fbHelpers from "../utils/serverFireBaseHlp/fbHelpers";
import axios from "axios";
import { SERVER_URL } from "./apiConst";
import { contentRequestData } from "../utils/contentRequests";
import { defaultSettings } from "../constants/defaultSettings";
import { userRequestData } from "../utils/userRequest";
import { sortByField } from "../utils/arraysFunc";
import { getuserDef, setUserDef } from "../utils/userSettings";

const BaseAPI = {
  async getAuthHeaders() {
    let token = JSON.parse(localStorage.getItem("tokencards"));
    if (!token) throw new Error("session not found");
    return {
      "Authorization": `Bearer ${token}`,
    };
  },
  getToken() {
    let token = JSON.parse(localStorage.getItem("tokencards"));
    if (!token) throw new Error("session not found");
    return token;
  },
  async serverReq(method, url, isHeader, data = "", params = "", formData = "") {
    let axiosConfig = {
      method: method,
      url: SERVER_URL + url,
    };
    if (params) axiosConfig.params = params;

    if (formData) {
      axiosConfig.data = formData;
    } else if (data) axiosConfig.data = { data: data };

    if (isHeader) axiosConfig.headers = await this.getAuthHeaders();

    try {
      let result = await axios(axiosConfig);
      if (method === "get" || url === "/users/login") return result.data;
      if (!!result.data && Object.keys(result.data).length !== 0) return result.data;
      return { status: true, message: "success" };
    } catch (error) {
      if (error.code === "ERR_NETWORK") return { error: error.message };
      return { error: error.response.data.error };
    }
  },

  async createUser(ud) {
    let reqData = {
      email: ud.email,
      password: ud.password,
      name: ud.name,
      img: ud.img || "/static/media/profile.dd82cd98f5e2825724fb.ico",
      settings: defaultSettings,
    };

    return await this.serverReq("post", "/users", false, reqData);
  },

  async getUser() {
    let result = await this.serverReq("get", "/users", true);
    if (result.error) throw new Error(result.error);
    let usrData = {
      ...result.data,
      password: "",
      // settings: sss,
      settings: result.data.settings ? JSON.parse(result.data.settings) : defaultSettings,
    };
    return usrData;
  },
  async login(login, passw) {
    let reqData = {
      email: login,
      password: passw.toString(),
    };

    let result = await this.serverReq("post", "/users/login", false, reqData);
    if (result.error) throw new Error(result.error);
    if (!result.token) throw new Error("no new session");

    let token = result.token;
    localStorage.setItem("Auth", "true");
    localStorage.setItem("tokencards", JSON.stringify(token));
    let usr = getuserDef().login;
    if (usr !== login && login) setUserDef(login);
    return { status: true, role: result.role };
  },
  async logout() {
    let result = await this.serverReq("delete", "/users/logout", true);
    if (!result.error) {
      localStorage.setItem("Auth", "false");
      localStorage.removeItem("tokencards");
    }
    return result;
  },
  async updateUser(ud) {
    let reqData = { ...ud };
    if (ud.img.includes("blob")) {
      let img = await fbHelpers.setImgToStorage(ud.id, ud.file);
      reqData = { ...ud, img: img };
    }
    delete reqData.file;

    let formData = userRequestData(reqData);
    return await this.serverReq("patch", "/users", true, reqData, "", formData);
  },
  async sendMailResetToken(login) {
    let reqData = {
      email: login,
      page: "card",
    };
    let result = await this.serverReq("post", "/resetpassword", false, reqData);
    if (result.error) throw new Error(result.error);
    return { status: true };
  },

  async CheckResetToken(resetToken) {
    let reqParams = { resetToken: resetToken };

    let result = await this.serverReq("get", "/resetpassword", false, "", reqParams);
    if (result.error) throw new Error(result.error);
    return { status: true };
  },
  async setNewPassword(password, resetToken) {
    let reqData = { password: password, resetToken: resetToken };
    let result = await this.serverReq("patch", "/resetpassword", false, reqData);

    if (result.error) throw new Error(result.error);
    return { status: true };
  },
  getAvatarUrl(num) {
    const avlist = JSON.parse(localStorage.getItem("avatars"));
    if (num > avlist.length()) return "";
    return avlist[num];
  },
  getAvatarUrlList(num) {
    const avlist = JSON.parse(localStorage.getItem("avatars"));

    return avlist;
  },
  createDB() {
    if (!localStorage.getItem("avatars")) {
      const avList = fbHelpers.getAvatarsFromStore();

      avList.then(localStorage.setItem("avatars", JSON.stringify(avList)));
    }
  },
};
export default BaseAPI;
