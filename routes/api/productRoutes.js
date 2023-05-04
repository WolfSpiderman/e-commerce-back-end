const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  // find all products
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model: Tag }],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag }],
    });

    if (!productData) {
      res.status(404).json('No product found with that id.');
      return;
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post('/', async (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      category_id: 2,
      tagIds: [1, 2, 3, 4]
    }
  */
 const { product_name, price, stock, category_id, tagIds } = req.body;

 if (!product_name || !price || !stock || !category_id || !tagIds || !Array.isArray(tagIds)) {
  return res.status(400).json({ message: 'Invalid request body.' });
 }
  try {
    const productData = await Product.create({
      product_name, 
      price, 
      stock, 
      category_id
    });
    
    if (req.body.tagIds && req.body.tagIds.length > 0) {
      const productTagArr = req.body.tagIds.map((tag_id) => ({
        product_id: productData.id,
        tag_id,
      }));
      await ProductTag.bulkCreate(productTagArr);
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// update product
router.put('/:id', async (req, res) => {
  // update product data
  try {
    const productData = await Product.update({
      product_name: req.body.product_name,
      price: req.body.price,
      stock: req.body.stock,
      category_id: req.body.category_id,
      tagIds: req.body.tagIds
    },
    {
      where: {
        id: req.params.id
      }
    });
    const productTags = await ProductTag.findAll({
      where: {
        product_id: req.params.id
      }
    });
    const productTagIds = productTags.map(({ tag_id }) => tag_id);
    const newProductTags = req.body.tagIds
    .filter((tag_id) => !productTagIds.includes(tag_id))
    .map((tag_id) => ({
        product_id: req.params.id,
        tag_id,
      }));
    const productTagsToRemove = productTags
    .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
    .map(({ id }) => id);

    const updateProductTags = await Promise.all([
      ProductTag.destroy({ where: { id: productTagsToRemove } }),
      ProductTag.bulkCreate(newProductTags),
    ]);

    res.status(200).json(updateProductTags);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id
      }
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with that id.'});
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
