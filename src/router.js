import Index from './views/index/Index.vue'
import Help from './views/Help.vue'

var router = [
	{
		name: 'index',
		path: '/',
    component: Index,
		title: 'Bitcoineum Mining Pool',
  },
	{
		name: 'help',
		path: '/help',
		component: Help,
		title: 'Mining Help'
	}
]

export default router;
