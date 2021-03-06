import React, { Component } from 'react';
import { Card, CardContent, Box, Grid, Typography, Container, Button } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { Redirect } from 'react-router-dom';
import jsPDF from 'jspdf';
import ProductInputRow from './productInputRow';

export default class NewInvoice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            productName: '',
            products: [
                {
                    name: '',
                    price: '',
                    taxRate: '',
                    discount: '',
                    searchedProduct: [],
                }
            ],
            total: 0,
            discount: 0,
            tax: 0,
            saveandPrint: false,
            client: {},
            newInvoiceId: ''
        }
        this.handleOptionClick = this.handleOptionClick.bind(this);
        this.removeProduct = this.removeProduct.bind(this);
        this.calculateTotalPrice = this.calculateTotalPrice.bind(this);
        this.calculateTotalTax = this.calculateTotalTax.bind(this);
        this.calculateTotalDiscount = this.calculateTotalDiscount.bind(this);
        this.addProductInputRow = this.addProductInputRow.bind(this);
        this.handleProductRowValueChange = this.handleProductRowValueChange.bind(this);
        this.getProductInputRow = this.getProductInputRow.bind(this);
        this.getSearchedProduct = this.getSearchedProduct.bind(this);
        this.addProduct = this.addProduct.bind(this);
        this.getSearchOptions = this.getSearchOptions.bind(this);
        this.saveandPrint = this.saveandPrint.bind(this);
        this.addNewItem = this.addNewItem.bind(this);
        this.getClient = this.getClient.bind(this);
        this.printInvoice = this.printInvoice.bind(this);
        this.fetchItems().then(Items => this.setState({ searchedProducts: Items }));
        this.getClient().then(Items => this.setState({ client: Items[0] }));
    }
    handleOptionClick(e, index, product) {
        let rows = this.state.products;
        rows[index].name = product.name;
        rows[index].price = product.price;
        rows[index].taxRate = product.taxRate;
        rows[index].searchedProduct = [];
        this.setState({ products: rows }, () => {
            this.setState({ total: this.calculateTotalPrice(), tax: this.calculateTotalTax() });
        });
    }
    removeProduct(index, e) {
        let rows = this.state.products;
        rows.splice(index, 1)
        this.setState({ products: rows });
    }
    calculateTotalPrice() {
        let Total = 0;
        this.state.products.forEach(product => {
            if (product.price === '') {
                Total += 0
            } else {
                Total += parseInt(product.price)
            }
        })
        return parseInt(Total)
    }
    calculateTotalTax() {
        let Tax = 0;
        this.state.products.forEach(product => {
            if (product.taxRate === '') {
                Tax += 0
            } else {
                Tax += parseInt(product.taxRate)
            }
        })
        return parseInt(Tax)
    }
    calculateTotalDiscount() {
        let Discount = 0;
        this.state.products.forEach(product => {
            if (product.discount === '') {
                Discount += 0
            } else {
                Discount += parseInt(product.discount)
            }
        })
        return parseInt(Discount)
    }
    addProductInputRow() {
        let rows = this.state.products;
        rows.push({ name: '', price: '', taxRate: '', discount: '', searchedProduct: [] });
        this.setState({ products: rows });
    }
    handleProductRowValueChange(e) {
        let row = this.state.products;
        let index = e.currentTarget.getAttribute('index')
        row[index][e.currentTarget.getAttribute('name')] = e.currentTarget.value;
        switch (e.currentTarget.getAttribute('name')) {
            case 'name':
                if (e.currentTarget.value !== '') {
                    this.getSearchedProduct(e.currentTarget.value).then(data => {
                        row[index].searchedProduct = data;
                    });
                }
                break;
            case 'price':
                this.setState({ total: this.calculateTotalPrice() })
                break;
            case 'taxRate':
                this.setState({ tax: this.calculateTotalTax() })
                break;
            case 'discount':
                this.setState({ discount: this.calculateTotalDiscount() });
                break;
            default:
                break;
        }
        this.setState({ products: row });
    }
    async getSearchedProduct(searchTerm) {
        let products = await fetch('http://localhost:3100/products/search/' + searchTerm).then(res => res.json());
        return products;
    };
    getProductInputRow() {
        return this.state.products.map((product, i) => {
            return <ProductInputRow
                key={i}
                product={product}
                index={i}
                removeProduct={this.removeProduct}
                handleProductRowValueChange={this.handleProductRowValueChange}
                handleOptionClick={this.handleOptionClick}
            />;
        })
    }
    addProduct() {
        this.setState({ selectedProducts: [...this.state.selectedProducts, this.state.searchedProducts[0]] });
        this.setState({ total: this.state.total + this.state.searchedProducts[0].price });
    }
    async addNewItem(productsId) {
        let response = await fetch('http://localhost:3100/invoices/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client: { name: this.state.client.name, id: this.state.client._id }, productsId: productsId }),
        })
        return response.json()
    }
    saveandPrint() {
        let productsId = this.state.selectedProducts.map(product => {
            return product._id
        })
        this.addNewItem(productsId)
            .then(newInvoice => this.printInvoice(newInvoice))
            .then(newInvoice => this.setState({ newInvoiceId: newInvoice._id, saveandPrint: true }))
    }
    printInvoice(invoice) {
        let doc = new jsPDF();
        doc.text(`invoice to ${invoice.client.name}`, 20, 20, 'right');
        invoice.productsId.forEach((id, i) => {
            doc.text(`product Id ${id}`, 20, 10 + (i * 10));
        });
        doc.text(`total price payable ${this.state.total}`, 20, 100);
        doc.save(`${invoice.client.id}.pdf`);
        return invoice;
    }
    async getClient() {
        let Items = await fetch('http://localhost:3100/clients/' + this.props.match.params.id).then(res => res.json());
        return Items;
    }
    async fetchItems() {
        let Items = await fetch('http://localhost:3100/products/').then(res => res.json());
        return Items;
    }
    getSearchOptions() {
        let options = this.state.searchedProducts.map((product, i) => {
            return (<option key={i} >{product.name}</option>)
        })
        return options
    }
    render() {
        if (this.state.saveandPrint) {
            return <Redirect to={"/invoices"} />
        }
        return (
            <Box p={2}>
                <Container>
                    <Grid container justify="space-between" alignItems="flex-start">
                        <Grid item xs={4}>
                            <Card variant="outlined">
                                <CardContent style={{ minHeight: 150 }}>
                                    <Typography variant="h6" gutterBottom={true}>
                                        {this.state.client.name}
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {this.state.client.address}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Box style={{ minHeight: 150 }} display="flex" flexDirection="column" justifyContent="space-between">
                                        <Typography align="right" variant="h6">Review</Typography>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography align="right" variant="body1">Tax</Typography>
                                            <Typography align="right" variant="body1">{this.state.tax}</Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography align="right" variant="body1">Discount</Typography>
                                            <Typography align="right" variant="body1">{this.state.discount}</Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography align="right" variant="body1">Total</Typography>
                                            <Typography align="right" variant="body1">{this.state.total}</Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                    <Box pt={3} pb={1}>
                        <Typography gutterBottom={true} variant="h6">Products</Typography>
                    </Box>
                    {this.getProductInputRow()}
                    <Button color="primary" size="small" onClick={this.addProductInputRow} startIcon={<AddIcon />}>Add Row</Button>
                </Container>
            </Box>
        )
    }
}