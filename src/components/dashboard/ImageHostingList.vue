<template>
    <div>
        <el-table stripe :data="visibleData" style="width: 100%" v-loading="loading" element-loading-text="Loading..."
            @selection-change="handleSelectionChange">
            <el-table-column type="selection"></el-table-column>

            <el-table-column v-for="column in tableColumns" :key="column.prop" :label="column.label" :prop="column.prop">
                <template #default="scope">
                    <!-- 判断列属性是否为 'ID' -->
                    <template v-if="!scope.row.editing && column.prop !== 'ID'">
                        {{ scope.row[column.prop] }}
                    </template>
                    <template v-else>
                        <!-- 在 'ID' 字段下显示文本 -->
                        <span v-if="column.prop === 'ID'">
                            {{ scope.row[column.prop] }}
                        </span>
                        <!-- 在编辑模式下，对于其他字段使用输入框 -->
                        <el-input v-else v-model="scope.row[column.prop]" size="small"></el-input>
                    </template>
                </template>
            </el-table-column>

            <el-table-column label="操作" width="140px" fixed="right">
                <template #default="scope">
                    <template v-if="!scope.row.editing">
                        <el-button @click="startEditing(scope.$index)" size="small">编辑</el-button>
                        <el-button @click="startDelete(scope.row.ID)" link type="danger">删除</el-button>
                    </template>
                    <template v-else>
                        <el-button @click="saveEdit(scope.$index, scope.row)" size="small">保存</el-button>
                        <el-button @click="cancelEdit(scope.$index)" size="small">取消</el-button>
                    </template>
                </template>
            </el-table-column>
        </el-table>

        <el-pagination background layout="prev, pager, next" :page-count="totalDataCount" :page-size="pageSize"
            @current-change="handlePageChange" />
    </div>
</template>
  
<script>
import { useToast } from "vue-toastification";
import http from '@/http';
export default {
    setup() {
        const toast = useToast();
        return { toast }
    },
    data() {
        return {
            loading: false,
            rawData: [{ ID: 1, Name: 'Item 1', Price: 10 }], // 原始数据
            visibleData: [], // 当前可见数据
            selectedRows: [], // 选择的行
            tableColumns: [], // 动态生成的表格列
            originalRow: null,
            totalDataCount: 0,
            pageSize: 10, 

        };
    },
    methods: {
        startEditing(index) {
            this.visibleData[index].editing = true;
            this.originalRow = { ...this.visibleData[index] }; //复制数据对比
        },
        startDelete(row) {
            const isAuthenticated = localStorage.getItem('token');

            http.post('/images_hosting/ImagesHosting_remove', { ID: row }, {
                headers: {
                    Authorization: isAuthenticated,
                },
            })
                .then(response => {
                    const data = response.data;
                    if (data.status) {
                        this.toast.success(data.message);
                        this.visibleData.splice(this.visibleData.findIndex(item => item.ID === row), 1)
                    } else {
                        this.toast.error(data.message);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        },
        saveEdit(index, row) {
            const editedRow = this.visibleData[index];
            if (JSON.stringify(editedRow) != JSON.stringify(this.originalRow)) {
                const isAuthenticated = localStorage.getItem('token');
                http.post('/images_hosting/ImagesHosting_edit', row, {
                    headers: {
                        Authorization: isAuthenticated,
                    },
                })
                    .then(response => {
                        const data = response.data;
                        this.toast.success(data.message);
                    })
                    .catch(error => {
                        return this.toast.error(error.data.message);
                    });
            }

            editedRow.editing = false;


        },
        cancelEdit(index) {
            // 取消编辑
            this.visibleData[index].editing = false;
        },
        handleSelectionChange(selection) {
            this.selectedRows = selection;
        },
        handlePageChange(pageNumber) {
            this.loadData(pageNumber);
        },
        loadData(pageNumber = 1) {
            this.loading = true;
            const isAuthenticated = localStorage.getItem('token');
            http.post('/images_hosting/ImagesHosting_list', {
                current_page: pageNumber,
                per_page: this.pageSize
            }, {
                headers: {
                    Authorization: isAuthenticated,
                },
            })
                .then(response => {

                    const data = response.data;
                    this.rawData = data.data;
                    this.loading = false;
                    this.totalDataCount = data.totalPages;

                    if (data.data.length === 0) {
                        return;
                    }

                    this.tableColumns = Object.keys(this.rawData[0]).map(key => ({
                        prop: key,
                        label: key,
                    }));


                    // this.visibleData = this.visibleData = JSON.parse(JSON.stringify(this.rawData));
                    this.visibleData = this.rawData


                })
                .catch(error => {
                    console.error(error);
                });
        },

    },
    mounted() {
        this.loadData();
    },
};
</script>
<style scoped>
.warning-row {
    background-color: yellow;
    /* 设置警告行的背景色为黄色 */
}
</style>