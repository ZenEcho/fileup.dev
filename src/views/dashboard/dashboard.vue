<template>
    <div class="common-layout">
        <el-container>
            <el-header>
                <el-menu class="el-menu-demo" mode="horizontal" :ellipsis="false">
                    <el-menu-item index="0" style="background-color: blueviolet; font-size: 1.5em; color: white;"
                        @click="this.$router.push('/imgtest');">UP</el-menu-item>
                    <div class="flex-grow" />
                    <el-menu-item index="1">图床对比</el-menu-item>
                    <el-sub-menu index="2">
                        <template #title>
                            {{ userInfo.username }}
                        </template>
                        <el-menu-item index="2-1" @click="Exitlogin">退出</el-menu-item>
                    </el-sub-menu>
                </el-menu>
            </el-header>
            <el-container>
                <el-aside width="200px">
                    <el-menu default-active="2" class="el-menu-vertical-demo">
                        <el-sub-menu index="1" disabled>
                            <template #title>
                                <el-icon>
                                    <User />
                                </el-icon>
                                <span>用户</span>
                            </template>
                            <el-menu-item-group title="个人信息">
                                <el-menu-item index="1-1">资料修改</el-menu-item>
                                <el-menu-item index="1-2">密码修改</el-menu-item>
                            </el-menu-item-group>
                        </el-sub-menu>
                        <el-menu @select="handleMenuSelect" default-active="2-0">
                            <el-sub-menu index="2">
                                <template #title>
                                    <el-icon>
                                        <Menu />
                                    </el-icon>
                                    <span>后台管理</span>
                                </template>
                                <el-menu-item-group title="系统管理">
                                    <el-menu-item index="1-1" disabled>用户管理</el-menu-item>
                                </el-menu-item-group>
                                <el-menu-item-group title="运营">
                                    <el-menu-item index="2-0">图床列表</el-menu-item>
                                    <el-menu-item index="2-1">收录审核</el-menu-item>
                                    <el-menu-item index="2-2">收录修改</el-menu-item>
                                </el-menu-item-group>
                            </el-sub-menu>
                        </el-menu>
                    </el-menu>
                </el-aside>
                <el-container>
                    <el-main>
                        <div v-if="selectedMenuItem === '2-0'">
                            <ImageHostingList></ImageHostingList>
                        </div>
                        <div v-if="selectedMenuItem === '2-1'">
                            <CollectionReview></CollectionReview>
                        </div>
                        <div v-if="selectedMenuItem === '2-2'">
                            <el-empty description="description" />
                        </div>
                    </el-main>
                </el-container>
            </el-container>
        </el-container>
    </div>
</template>
  
<script>
import CollectionReview from '@/components/dashboard/CollectionReview.vue'
import ImageHostingList from '@/components/dashboard/ImageHostingList.vue'
import { useToast } from "vue-toastification";
export default {

    components: {
        CollectionReview, ImageHostingList
    },
    setup() {
        const toast = useToast();
        return {
            toast,
        };
    },

    data() {
        return {
            selectedMenuItem: '2-0',
            userInfo: {}
        }
    },
    mounted() {
        // 在组件挂载后，从 localStorage 中读取 userInfo 数据
        const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));

        if (storedUserInfo) {
            this.userInfo = storedUserInfo; // 将数据存储到 userInfo 属性中
        }

    },
    methods: {
        Exitlogin() {
            localStorage.clear();
            this.$router.push('/login')
        },
        handleMenuSelect(index) {
            this.selectedMenuItem = index;
        },

    },
};
</script>
<style scoped>
.flex-grow {
    flex-grow: 1;
}
</style>