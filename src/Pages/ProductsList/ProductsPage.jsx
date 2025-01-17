import NavBar from '../../components/molecules/navBar/NavBar.jsx';
import { Footer } from '../../components/molecules/footer/Footer';
import {StyledProductsList} from "./style.js";
import { Product } from '../../components/molecules/product/Product.jsx';
import { useState, useEffect } from 'react';
import { SearchBar } from '../../components/molecules/searchBar/SearchBar.jsx';
import { Progress } from '../../components/atoms/Progress/Progress.jsx';
import { FormControl, InputLabel, MenuItem, Select as MUISelect } from '@mui/material';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ScrollUp } from '../../components/atoms/ScrollUp/ScrollUp.jsx';
import { useSelector, useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { logout } from '../../slices/auth_slice.js';
import { emptyCart } from '../../slices/cart_slice.js';


export const ProductsPage = ({commerce}) => { 

    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState([])
    const [productsFilters, setProductsFilters] = useState([])
    const [dataBrandFormated, setDataBrandFormated]  = useState([]);
    const [searchBarValue, setSearchBarValue]  = useState('');
    const [optionsBrandFormated, setOptionsBrandFormated]  = useState([]);
    const [notices, setNotices] = useState(null);
    const [sort, setSort] = useState(0) 
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    //////////////////////////////////////
    //si l'id de l'utilisateur n'est pas connue --> retourner à l'étape d'authentification
    const cstmrIdListener  = useSelector((state) => {
        return state?.auth?.cstmrId
    })

    useEffect(() => {
        if (cstmrIdListener === null) {
            dispatch(logout());
            dispatch(emptyCart());
            commerce.cart.empty();
            navigate("/sign-in");
        } else {
            fetchCategories();
        }
    }, [])
    //////////////////////////////////////
    
    // sort functions
    const sortByPriceDec = () => {
        productsFilters.sort((a, b) => b.price.raw - a.price.raw);
    }
    
    const sortByPriceCr = () => {
        productsFilters.sort((a, b) => a.price.raw - b.price.raw);
    }

    const sortByName = () => {
        productsFilters.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // traitement du tri
    const handleChangeSort = (event) => {
        setSort(event.target.value);
        if (event.target.value === 1){
            sortByName()
        } else if (event.target.value === 2) {
            sortByPriceCr()
        } else if (event.target.value === 3) {
            sortByPriceDec()
        }
    };  

    // récupération des avis
    const fetchNotices = async () => {
        await axios
            .get(process.env.REACT_APP_DIRECTUS_URL+'items/notice')
            .then((res) => {
                setNotices(res.data)
                setIsLoading(false);
            })
            .catch((err) => {
                navigate('/error');
            })
    }

    // récupération des produits
    const fetchProducts = async() => {
        await commerce.products.list().then((products) => {
            setProducts(products.data);
            setProductsFilters(products.data);
            fetchNotices();
        }).catch((error) => {
            navigate('/error');
        });
    }

    // récupération des marques disponibles
    const fetchCategories = async () => {
        var allBrandsFormated = [];
        var allBrands = [];
        await commerce.categories.retrieve('cat_ZRjywMVPJo7Y8G').then((brands) => {
            brands.children.map((brand, i) => {
                allBrands.push(brand.slug)
                allBrandsFormated.push({ value:i, label: brand.slug})
                
            });
            setDataBrandFormated(allBrandsFormated);
            setOptionsBrandFormated(allBrandsFormated)
            fetchProducts();
        }).catch((error) => {
            navigate('/error');
        });
    }

    // lorsque la valeur de la barre de recherche et/ou des filtres change --> modifier l'affichage des produits
    useEffect(() => {
        if (!isLoading){
            let SearchProductsList = [];
            let filteredProductsList = [];
            // si on supprimer le contenue de la search bar --> afficher l'ensemble des produits
            if (searchBarValue !== ''||searchBarValue !== undefined||searchBarValue !== null){
                products.map((product)=>{
                    if (product.name.toLowerCase().includes(searchBarValue.toLowerCase())){
                        SearchProductsList.push(product);
                    }
                })  
            } else {
                SearchProductsList = products;
            }
            SearchProductsList.map((product)=>{
                if (dataBrandFormated.find((e) => e.label===product.categories[0].slug)!==undefined){
                    filteredProductsList.push(product);
                }
            })
            
            setSort(0);
            setProductsFilters(filteredProductsList);
        }
    },[dataBrandFormated, searchBarValue])

    // calcul de la note globale de chaque article
    const CalculateGlobalRate = (data) => {
        var addrate = 0;
        data.map((notice) => addrate += notice.note)
        return (addrate/data.length).toFixed(1);
    }

    // récupération du nombre d'avis et de la note de chaque article grâce à leur ID
    const getNoticesById = (id_product) => {
        let nbNotice = 0;
        let noticesCatched = [];
        let totalRating = 0;
        notices?.data?.map((notice) => {
            if (notice.id_product === id_product) {
                noticesCatched.push(notice)
                nbNotice ++;
            }
        })
        totalRating = CalculateGlobalRate(noticesCatched);
        return [nbNotice, totalRating]
    }

    return (isLoading === true) ? (<Progress />) : (
        <>
            <NavBar id="top" commerce={commerce}/>
            <StyledProductsList>
                <div className='products-list-header'>
                    <SearchBar options={products} setSearchBarValue={setSearchBarValue}/>
                    <div className='products-list-header-sort-filtre'>
                        <div className='products-list-header-sort'>
                            <FormControl sx={{ m: 1, minWidth: 80, mt: 2,backgroundColor:"#FFFFFF",}}>
                                <InputLabel>Trier par</InputLabel>
                                <MUISelect
                                    value={sort}
                                    onChange={handleChangeSort}
                                    autoWidth
                                    label="Trier par"
                                >
                                    <MenuItem value={0}>Choisir</MenuItem>
                                    <MenuItem value={1}>Nom</MenuItem>
                                    <MenuItem value={2}>Prix croissant</MenuItem>
                                    <MenuItem value={3}>Prix decroissant</MenuItem>
                                </MUISelect>
                            </FormControl>
                        </div>
                        <div className='products-list-header-filtre'>
                            <p>Marques :</p>
                            <Select
                                defaultValue={dataBrandFormated}
                                isMulti
                                name="colors"
                                onChange={
                                    (newBrands)=> {
                                        if (newBrands.length > 0) {
                                            setDataBrandFormated(newBrands)
                                        } else {
                                            toast.error('Au moins une marque doit être selectionnée', {
                                                position: toast.POSITION.BOTTOM_CENTER
                                            })
                                        }
                                    }
                                }
                                options={optionsBrandFormated}
                                className="basic-multi-select"
                                classNamePrefix="select"
                            />
                        </div>
                    </div>
                </div>
                <div className='products-list-articles'>
                    {(productsFilters.length > 0)?
                        productsFilters?.map((product) => {
                        let current_value_notice = getNoticesById(product.id);
                        return (
                            <div key={product.id} className="products-list-articles-item" onClick={() => navigate('/products/'+ product.id)}>
                                <Product product={product} rate={Number(current_value_notice[1])} nbFeedBack={current_value_notice[0]} />
                            </div>
                        )
                    }):<p>Aucun produits ne correspond à vos critères</p>}
                </div>
            </StyledProductsList>
            <Footer />
            <ToastContainer />
            <ScrollUp scrollStepInPx={15} delayInMs={5}/>
        </>
    )
}