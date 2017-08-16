<template>
  <div class="headerWrapper">
    <header class="header">
      <div class="container">
        <h1>
          <a href="/" class="router-link-active">
            GaoPool
          </a>
          <sup>beta</sup>
        </h1>
        <div class="nav" style="float: right;">
        <el-menu mode="horizontal">
          <el-menu-item index="1"><router-link :to="{ name: 'help'}">Help</router-link></el-menu-item>
        </el-menu>
        </div>
      </div>
    </header>
  </div>
</template>
