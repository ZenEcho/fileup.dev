<template>
  <section id="providers" class="bg-slate-900 text-white py-80px text-center relative overflow-hidden">
    <!-- Background Grid -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

    <div class="container-custom relative z-10">
      <h2 class="text-2rem mb-15 font-bold">{{ t('providers.title') }}</h2>
      
      <div class="grid md:grid-cols-3 gap-10 max-w-1000px mx-auto text-left">
        <!-- Image Hosts -->
        <div class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <div class="flex items-center gap-3 mb-6 text-indigo-300">
            <div class="i-ph-image-square-fill text-xl" />
            <h3 class="font-bold">图床平台</h3>
          </div>
          <div class="flex flex-wrap gap-3">
            <span v-for="p in imageHosts" :key="p" class="px-3 py-1 bg-white/10 rounded-lg text-0.85rem hover:bg-indigo-500/50 transition-colors cursor-default">
              {{ p }}
            </span>
          </div>
        </div>

        <!-- Object Storage -->
        <div class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <div class="flex items-center gap-3 mb-6 text-violet-300">
            <div class="i-ph-cloud-fill text-xl" />
            <h3 class="font-bold">对象存储</h3>
          </div>
          <div class="flex flex-wrap gap-3">
            <span v-for="p in cloudStorage" :key="p" class="px-3 py-1 bg-white/10 rounded-lg text-0.85rem hover:bg-violet-500/50 transition-colors cursor-default">
              {{ p }}
            </span>
          </div>
        </div>

        <!-- Others -->
        <div class="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
          <div class="flex items-center gap-3 mb-6 text-emerald-300">
            <div class="i-ph-code-fill text-xl" />
            <h3 class="font-bold">开发 & 自定义</h3>
          </div>
          <div class="flex flex-wrap gap-3">
            <span v-for="p in others" :key="p" class="px-3 py-1 bg-white/10 rounded-lg text-0.85rem hover:bg-emerald-500/50 transition-colors cursor-default">
              {{ p }}
            </span>
          </div>
        </div>
      </div>

      <p class="mt-12 text-slate-400 text-0.9rem flex justify-center items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
        <span class="i-ph-puzzle-piece-fill" />
        {{ t('providers.more') }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Manual categorization based on known values
const imageHosts = ['Lsky Pro', 'EasyImages', 'Chevereto', 'ImgURL', 'Hellohao', 'SM.MS', 'Imgur']
const cloudStorage = ['阿里云 OSS', '腾讯云 COS', 'AWS S3']
const others = ['GitHub Repo', '自定义 HTTP']
</script>
