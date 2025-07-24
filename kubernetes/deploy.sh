#!/bin/bash


kubectl apply -f namespace.yaml
kubens biglab

kubectl apply -f mongodb-configmap.yaml
kubectl apply -f backend-configmap.yaml
kubectl apply -f frontend-configmap.yaml

kubectl apply -f mongodb-pv.yaml
kubectl apply -f storage-class.yaml

kubectl apply -f mongodb-statefulset.yaml

kubectl wait --for=condition=ready pod/mongodb-0 --timeout=300s

kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

kubectl wait --for=condition=available deployment/backend --timeout=300s
kubectl wait --for=condition=available deployment/frontend --timeout=300s

kubectl get service frontend
