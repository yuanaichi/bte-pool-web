<template>
  <div>
      <TopHeader />
      <div class="main-cnt">
        <div class="page-container">
          <h2>帮助中心</h2>
        </div>
      </div>
      <Foot />
  </div>
</template>

<script>
import TopHeader from '../components/TopHeader.vue'
import Foot from '../components/Footer.vue'

export default {
  components: {
    TopHeader,
    Foot
  }
}
</script>
