import * as repo from './products.repository.js'
import type { CreateProductInput, UpdateProductInput, ProductQuery } from './products.schema.js'

export async function listProducts(query: ProductQuery, adminMode = false) {
  const { rows, total, page, limit } = await repo.findProducts(query, adminMode)
  return {
    data: rows,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  }
}

export async function getProduct(id: number) {
  const product = await repo.findProductById(id)
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  return product
}

export async function createProduct(input: CreateProductInput) {
  return repo.createProduct(input)
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  const product = await repo.updateProduct(id, input)
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
  return product
}

export async function listProductsByGroup(groupKey: string) {
  const rows = await repo.findProductsByGroupKey(groupKey)
  if (rows.length === 0) throw Object.assign(new Error('Group not found'), { statusCode: 404 })
  return rows
}

export async function deleteProduct(id: number) {
  const product = await repo.softDeleteProduct(id)
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 })
}
