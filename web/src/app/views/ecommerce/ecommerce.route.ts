import { Route } from '@angular/router'
import { Products } from './products/products'
import { ProductDetails } from './product-details/product-details'
import { Create } from './create/create'
import { Customers } from './customers/customers'
import { Sellers } from './sellers/sellers'
import { Orders } from './orders/orders'
import { OrderDetails } from './order-details/order-details'
import { Inventory } from './inventory/inventory'

export const ECOMMERCE_ROUTES: Route[] = [
  {
    path: 'products',
    component: Products,
    data: { title: 'Products' },
  },
  {
    path: 'product/:id',
    component: ProductDetails,
    data: { title: 'Product Details' },
  },
  {
    path: 'create',
    component: Create,
    data: { title: 'Create Product' },
  },
  {
    path: 'customers',
    component: Customers,
    data: { title: 'Customers List' },
  },
  {
    path: 'sellers',
    component: Sellers,
    data: { title: 'Sellers List' },
  },
  {
    path: 'orders',
    component: Orders,
    data: { title: 'Orders List' },
  },
  {
    path: 'orders/:id',
    component: OrderDetails,
    data: { title: 'Order details' },
  },
  {
    path: 'inventory',
    component: Inventory,
    data: { title: 'Inventory' },
  },
]
