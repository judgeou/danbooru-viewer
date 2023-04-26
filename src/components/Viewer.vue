<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'

interface IPost {
  id: number,
  file_url: string,
  large_file_url: string,
  image_height: number,
  image_width: number,
  tag_string_general: string,
  tag_string_copyright: string,
  tag_string_character: string,
  file_ext: string
}

const addition_tags = [ 'rating:General' ]

const tag_input = ref('')
const posts = ref([] as IPost[])
const isLoading = ref(false)
const isRandom = ref(true)
const random_startdate = ref('2015-01-01')
const random_enddate = ref(dayjs().format('YYYY-MM-DD'))

async function search () {
  isLoading.value = true
  const tags = `${tag_input.value} ${addition_tags.join(' ')} ${get_random_tags()}`
  const res = await fetch(`https://danbooru.donmai.us/posts.json?limit=20&tags=${tags}`)
  posts.value = await res.json()
  isLoading.value = false
}

function get_random_tags () {
  if (isRandom.value) {
    // 定义开始和结束日期
    const startDate = dayjs(random_startdate.value)
    const endDate = dayjs(random_enddate.value)

    // 计算开始和结束日期之间的天数
    const days = endDate.diff(startDate, 'day');

    // 随机选择一个天数
    const randomDays = Math.floor(Math.random() * days);

    // 创建新日期并添加随机天数
    const resultDate = startDate.add(randomDays, 'day');

    return `date:${resultDate.format('YYYY-MM-DD')} order:random`
  } else {
    return ''
  }
}

async function copy_img_tags (post: IPost) {
  const alltags = [
    ...post.tag_string_character.split(' '),
    ...post.tag_string_general.split(' ')
  ]
  const tags_copy = alltags.join(', ')

  await navigator.clipboard.writeText(tags_copy)

  alert(tags_copy.slice(0, 100) + '...')
}
</script>

<template>
  <div>
    <input type="text" placeholder="tags" v-model="tag_input" style="width: 300px;">
    <label>
      <input type="checkbox" v-model="isRandom"> random
    </label>
    <span v-if="isRandom">
      <input type="date" v-model="random_startdate" />
      <input type="date" v-model="random_enddate" />
    </span>

  </div>

  <div style="margin-top: 8px;">
    <button :disabled="isLoading" @click="search" style="height: 30px;">Search</button>
  </div>

  <div class="img-container">
    <div v-for="post in posts" :key="post.id" class="img-item" @click="copy_img_tags(post)">
      <img v-if="['png', 'jpg', 'gif'].indexOf(post.file_ext) >= 0" :src="post.large_file_url">
      <video v-if="['mp4', 'webm'].indexOf(post.file_ext) >= 0" :src="post.large_file_url"></video>
    </div>
  </div>
</template>

<style scoped>
.img-container .img-item img, .img-container .img-item video {
  width: 250px;
  height: auto;
  display: block;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
.img-container .img-item {
  flex: 1 0 calc(100% / 3);
  max-width: calc(100% / 3);
  margin-bottom: 80px;
}
.img-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 12px;
}
</style>
